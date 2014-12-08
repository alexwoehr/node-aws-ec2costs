var aws = require("aws-sdk");
aws.config.region = "us-east-1";

var ec2 = new aws.EC2();

var hoursPerMonth = 24 * 30;

ec2Prices = {
  "m1.large" : 0.175,
  "m3.medium" : 0.07,
  "m3.xlarge" : 0.280,
  "m3.2xlarge" : 0.560,
  "m1.medium" : 0.087,
  "t2.micro" : 0.013,
  "t2.small" : 0.026,
  "t2.medium" : 0.052,
  "m3.large" : 0.140,
  "t1.micro" : 0.020,
  "m1.xlarge" : 0.480,
  "m2.xlarge" : 0.410,
  "m2.2xlarge" : 0.820,
  "m2.4xlarge" : 1.640,
  "g2.2xlarge" : 0.650,
  "cr1.8xlarge" : 3.500,
  "i2.xlarge" : 0.853,
  "i2.2xlarge" : 1.705,
  "i2.4xlarge" : 3.410,
  "i2.8xlarge" : 6.820,
  "hi1.4xlarge" : 3.100,
  "hs1.8xlarge" : 4.600,
  "m1.small" : 0.044,
  "m1.medium" : 0.087,
  "m1.medium" : 0.175,
  "m1.medium" : 0.350,
  "c1.medium" : 0.130,
  "c1.xlarge" : 0.520,
  "cc2.8xlarge" : 2.000,
  "cg1.4xlarge" : 2.100,
  "m2.xlarge" : 0.245,
  "m2.2xlarge" : 0.490,
  "m2.4xlarge" : 0.980,
  "cr1.8xlarge" : 3.500,
  "hi1.4xlarge" : 3.100,
  "c3.large" : 0.105,
  "c3.xlarge" : 0.210,
  "c3.2xlarge" : 0.420,
  "c3.4xlarge" : 0.840,
  "c3.8xlarge" : 1.680,
  "r3.large" : 0.175,
  "r3.xlarge" : 0.350,
  "r3.2xlarge" : 0.700,
  "r3.4xlarge" : 1.400,
  "r3.8xlarge" : 2.800
};

var magVolumeCost = 0.050; // cost for magnetic volume
var gp2VolumeCost = 0.125; // cost for ssd provisioned iops ("gp2")
var iopsgp2VolumeCost = 0.065; // cost for iops for gp2

// Assuming it's not reserved
function computeInstanceMonthlyCost(instance) {
  return ec2Prices[instance.InstanceType] * hoursPerMonth;
}

// Assuming it's magnetic
function computeVolumeMonthlyCost(volume) {
  if (volume.VolumeType === "standard") {
    return magVolumeCost * volume.Size;
  } else if (volume.VolumeType === "gp2") {
    return gp2VolumeCost * volume.Size + volume.Iops * iopsgp2VolumeCost;
  } else {
    throw "Unsupported volume type";
  }
}

// Instances
ec2.describeInstances({}, function(err, data) {
  if (err) { console.log(err); return; }

  var reservations = data.Reservations;
  var instances = [];
  if (reservations && "0" in reservations) reservations.forEach(function (curReservation) {
    if ("Instances" in curReservation && "0" in curReservation.Instances) curReservation.Instances.forEach(function (curInstance) {
      instances.push(curInstance);
    })
  });

  var cost = instances
      .filter(function (i) { return i.State.Name === 'running'; })
      .map(function (i) { x= computeInstanceMonthlyCost(i); console.log("a(n) "+ i.InstanceType + " with monthly cost $"+parseFloat(x, 2)); return x })
      .reduce(function (memo, cost) { return memo + parseFloat(cost); }, 0);


  console.log('monthly ec2 cost: $'+ String(cost));

});

// Volumes
ec2.describeVolumes({}, function(err, data) {
  if (err) { console.log(err); return; }

  var volumes = data.Volumes;
  if ("Volumes" in data && "0" in volumes) volumes.forEach(function (curVolume) {
    volumes.push(curVolume);
  })

  var cost = volumes
      .map(function (v) { x= computeVolumeMonthlyCost(v); console.log("a volume of size "+ v.Size + " with monthly cost $"+parseFloat(x, 2)); return x })
      .reduce(function (memo, cost) { return memo + parseFloat(cost); }, 0);


  console.log('monthly ebs cost: $'+ String(cost));

});

