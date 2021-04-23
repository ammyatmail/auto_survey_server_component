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
  const { age, gender, license, firstcar, drivetrain, fuel, carscount, cars } = req.body;
  console.log(req.body);
  if (!age) {
    return res.status(400).json({
      message: 'Age is required',
    });
  }
  const payload = { age, gender, license, firstcar, drivetrain, fuel, carscount, cars };
  req.collection.insertOne(payload)
    .then(result => res.json(result.ops[0]))
    .catch(error => res.send(error));
});

// GET /api/survey/age is to get information about ['Below 18', 'UnLicensed Driver', 'First car owners participated', 'Targetable Clients']
router.get('/api/survey/age', async (req, res, next) => {
  let allDbRequest = [];
  let label = ['Below 18', 'UnLicensed Driver', 'First car owners participated', 'Targetable Clients'];
  allDbRequest.push(req.collection.count({ age: { $lt: 18 } }));
  allDbRequest.push(req.collection.count({ age: { $gt: 18 }, license: "no" }));
  allDbRequest.push(req.collection.count({ age: { $lt: 26 }, age: { $gt: 17 }, firstcar: "yes" }));
  allDbRequest.push(req.collection.count({ license: "yes", firstcar: "no" }));
  let total = [];
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
  let allDbRequest = [];
  let label = ['Fuel Emission(%)', 'Drive Train(%)', 'Others(%)'];
  allDbRequest.push(req.collection.count({ license: "yes", firstcar: "no" }));
  allDbRequest.push(req.collection.count({ license: "yes", firstcar: "no", fuel: "yes" }));
  allDbRequest.push(req.collection.count({ license: "yes", firstcar: "no", $or: [{ drivetrain: "fwd", drivetrain: "idontknow" }] }));

  let total = [];
  total.push(label);
  Promise.all(allDbRequest).then(function (data) {
    //console.log(data);//result will be array which contains each promise response
    let fuelpercentage = (data[1] * 100) / data[0];
    let drivepercentage = (data[2] * 100) / data[0];
    let other = 100 - (fuelpercentage + drivepercentage);
    if (other > 100 | other < 0) {
      other = 0;
    }
    let tdata = [];

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
  let allDbRequest = [];
  allDbRequest.push(req.collection.aggregate([{ $group: { _id: null, "Average": { $avg: "$carscount" } } }]).toArray());
  Promise.all(allDbRequest).then(function (data) {
    //console.log(Math.ceil(data[0][0]['Average']));
    res.json(Math.ceil(data[0][0]['Average']));
  }).catch(function (err) {
    console.log(err);
  });
});

// GET /api/survey/carmodel/:cmake is to get information about models for a particular car make like BMW, MERCEDEZ
router.get('/api/survey/carmodel/:cmake', async (req, res, next) => {
  let allDbRequest = [];
  allDbRequest.push(req.collection.find({}).toArray());
  Promise.all(allDbRequest).then(function (data) {
    let label = [];
    let tData = [];

    for (let survey of data[0]) {
      for (let car of survey.cars) {
        if (car.carMakeInfo == req.params.cmake) {

          if (label.indexOf(car.carModelInfo) > -1) {
            tData[label.indexOf(car.carModelInfo)] = tData[label.indexOf(car.carModelInfo)] + 1;
          } else {
            label.push(car.carModelInfo);
            tData.push(1);
          }
        }
      }

    }

    let fdata = [];
    fdata.push(label);
    fdata.push(tData);
    res.json(fdata);
  }).catch(function (err) {
    console.log(err);
  });
});

// GET /api/survey/carmake is to get information about car makers like BMW, MERCEDEZ
router.get('/api/survey/carmake', async (req, res, next) => {
  let allDbRequest = [];
  allDbRequest.push(req.collection.find({}).toArray());
  Promise.all(allDbRequest).then(function (data) {
    let label = [];
    let tData = [];

    for (let survey of data[0]) {
      for (let car of survey.cars) {

        if (label.indexOf(car.carMakeInfo) > -1) {
          tData[label.indexOf(car.carMakeInfo)] = tData[label.indexOf(car.carMakeInfo)] + 1;
        } else {
          label.push(car.carMakeInfo);
          tData.push(1);
        }
      }

    }

    let fdata = [];
    fdata.push(label);
    fdata.push(tData);
    res.json(fdata);
  }).catch(function (err) {
    console.log(err);
  });
});

module.exports = router;
