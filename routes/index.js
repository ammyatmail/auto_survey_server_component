var express = require('express');
var router = express.Router();
const ObjectID = require('mongodb').ObjectID;


// GET /api/survey is to get all survey information
router.get('/api/survey', (req, res, next) => {
  req.collection.find({})
    .toArray()
    .then(results => res.json(results))
    .catch(error => res.send(error));
});

// POST /api/survey is to post the survey json data
router.post('/api/survey', async (req, res, next) => {
  const { age, gender, license, firstcar, drivetrain, fuel, carscount, carmake, carmodel } = req.body;
  if (!age) {
    return res.status(400).json({
      message: 'Age is required',
    });
  }
  const payload = { age, gender, license, firstcar, drivetrain, fuel, carscount, carmake, carmodel };
  req.collection.insertOne(payload)
    .then(result => res.json(result.ops[0]))
    .catch(error => res.send(error));
});

// GET /api/survey/age is to get information about ['Below 18', 'UnLicensed Driver', 'First car owners participated', 'Targetable Clients']
router.get('/api/survey/age', async (req, res, next) => {
  var allDbRequest = [];
  var label = ['Below 18', 'UnLicensed Driver', 'First car owners participated', 'Targetable Clients'];
  allDbRequest.push(req.collection.count({ age: { $lt: 18 } }));
  allDbRequest.push(req.collection.count({ age: { $gt: 18 }, license: "no" }));
  allDbRequest.push(req.collection.count({ age: { $lt: 26 }, age: { $gt: 17 }, firstcar: "yes" }));
  allDbRequest.push(req.collection.count({ license: "yes", firstcar: "no" }));
  var total = [];
  total.push(label);
  Promise.all(allDbRequest).then(function (data) {
      //console.log(data);//result will be array which contains each promise response
      total.push(data);
      res.json(total);
  }).catch(function (err) {
       console.log(err);
  });
});

// GET /api/survey/targetableclients is to get information about targetable clients
router.get('/api/survey/targetableclients', async (req, res, next) => {
  var allDbRequest = [];
  var label = ['Fuel Emission(%)', 'Drive Train(%)', 'Others(%)'];
  allDbRequest.push(req.collection.count({ license: "yes", firstcar: "no" }));
  allDbRequest.push(req.collection.count({ license: "yes", firstcar: "no", fuel: "yes" }));
  allDbRequest.push(req.collection.count({ license: "yes", firstcar: "no" , $or: [{ drivetrain: "fwd", drivetrain: "idontknow" }] }));

  var total = [];
  total.push(label);
  Promise.all(allDbRequest).then(function (data) {
      //console.log(data);//result will be array which contains each promise response
      let fuelpercentage = (data[1] * 100)/data[0];
      let drivepercentage = (data[2] * 100)/data[0];
      let other = 100 - (fuelpercentage+drivepercentage);
      if(other > 100 | other < 0) { 
        other = 0;
      }
      var tdata = [];

      tdata.push(fuelpercentage);
      tdata.push(drivepercentage);
      tdata.push(other);
      total.push(tdata);
      res.json(total);
  }).catch(function (err) {
       console.log(err);
  });
});

// GET /api/survey/averagecar is to get information about average car per family
router.get('/api/survey/averagecar', async (req, res, next) => {
  var allDbRequest = [];
  allDbRequest.push(req.collection.aggregate([{ $group: { _id : null, "Average" : {$avg: "$carscount" }}}]).toArray());
  Promise.all(allDbRequest).then(function (data) {
      //console.log(Math.ceil(data[0][0]['Average']));
      res.json(Math.ceil(data[0][0]['Average']));
  }).catch(function (err) {
       console.log(err);
  });
});

// GET /api/survey/carmodel/:cmake is to get information about models for a particular car make like BMW, MERCEDEZ
router.get('/api/survey/carmodel/:cmake', async (req, res, next) => {
  var allDbRequest = [];
  allDbRequest.push(req.collection.aggregate([{  
    $group: {
      _id: {
        carmake: "$carmake",
        carmodel: "$carmodel"
      },
      count: {
          "$sum": 1
      }
  }
}, {
  $group: {
      _id: "$_id.carmake",
      CARMODEL_GROUP: {
          $push: {
            carmodel: "$_id.carmodel",
              count: "$count"
          }
      }
  }

  
  }]).toArray());
  Promise.all(allDbRequest).then(function (data) {
      //console.log(data[0]);//result will be array which contains each promise response
      var label = [];
      var tdata = [];
      if(req.params.cmake == " "){
        res.json(data[0]);
        return;
      }
      for(let make of data[0]) {
        if(make._id==req.params.cmake){
          for(let model of make.CARMODEL_GROUP) {
              //console.log(model.carmodel+ "  "+model.count);
              label.push(model.carmodel);
              tdata.push(model.count);
          }
        }
    }

    var fdata = [];
    fdata.push(label);
    fdata.push(tdata);
    res.json(fdata);
  }).catch(function (err) {
       console.log(err);
  });
});

// GET /api/survey/carmake is to get information about car makers like BMW, MERCEDEZ
router.get('/api/survey/carmake', async (req, res, next) => {
  var allDbRequest = [];
  allDbRequest.push(req.collection.aggregate([{  
   
      $group: {
        _id: "$carmake", 
        count: {
          $sum: 1
        }
      }
 
  }]).toArray());
  Promise.all(allDbRequest).then(function (data) {
      //console.log(data[0]);//result will be array which contains each promise response
      var label = [];
      var tdata = [];
          for(let model of data[0]) {
            if(model._id!='' && model._id!=null){
              label.push(model._id);
              tdata.push(model.count);
            }
          }

    var fdata = [];
    fdata.push(label);
    fdata.push(tdata);
    res.json(fdata);
  }).catch(function (err) {
       console.log(err);
  });
});

module.exports = router;
