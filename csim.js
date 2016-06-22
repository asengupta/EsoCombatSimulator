var Q = require("q");
var _ = require("underscore");

var CombatEvent = function(base, abilityName) {
  this.abilityName = base instanceof CombatEvent ? base.abilityName : abilityName;
  var self = this;
  this.final = base;
  this.finalValue = base instanceof CombatEvent ? f(base.finalValue()) : base;
  this.stageMap = {base: this.final};
  this.valueAt = function(stageName) { return self.stageMap[stageName]; };
  this.addModifier = function(modifier, stageName) {
    var x = this.final;
    this.final = this.finalValue = function() { return modifier(x); };
    this.stageMap[stageName] = this.final;
    return self;
  };
};

var Event = function(name) {

};

var f = function(v) { return function() { return v; } };
var doubler = function(f) { return f()*2; }
var tripler = function(f) { return f()*3; }
var quadrupler = function(f) { return f()*4; }
var dmgPipeline = new CombatEvent(f(20), "Venomous Claw");
// dmgPipeline.addModifier(doubler, "Doubler").addModifier(tripler, "Tripler").addModifier(quadrupler, "4x");

// console.log(dmgPipeline.valueAt("Doubler")());
// console.log(dmgPipeline.valueAt("Tripler")());
// console.log(dmgPipeline.valueAt("4x")());
// console.log(dmgPipeline.finalValue());

var decoratedPipeline = function(basePipeline, factor) {
  var dotPipeline = new CombatEvent(basePipeline);
  var pct9 = function(f) { return f.finalValue() + f.finalValue()/2*factor  ; };
  dotPipeline.addModifier(pct9, "+9%");
  return dotPipeline;
};

var statsModel = new Model() {
  var he
};

var Timeline = function() {
  var self = this;
  var observerTriggers = {};
  var currentTime = 0.0;
  var timeStep = 0.2;

  this.runTo = function(endTime) {
    currentTime = 0.0;
    while (currentTime <= endTime) {

      _.each(observerTriggers[currentTime], function(trigger) {
        console.log("[" + currentTime + "] Damage from " + trigger.abilityName + " was " + trigger.finalValue());
      });
      currentTime += timeStep;
    }
  };

  this.at = function(instant) {
    return {
      effect: function(CombatEvent) {
        if (!observerTriggers[instant.time]) observerTriggers[instant.time] = [];
        observerTriggers[instant.time].push(CombatEvent);
        return self;
      }
    }
  }
};

var timeline = new Timeline();
var TimeCounter = function(instant) {
    var self = this;
    this.instant = instant;
    this.advance = function(interval) {
      self.instant = self.instant.after(interval);
      return self;
    };
    this.now = function() { return self.instant; };
};

var Instant = function(time) {
    this.time = time;
    this.after = function(interval) {
      return new Instant(time + interval);
    };
};

var instant = new Instant(0.2);
var ctr = new TimeCounter(instant);

timeline.at(ctr.now()).effect(dmgPipeline)
        .at(ctr.advance(0.4).now()).effect(decoratedPipeline(dmgPipeline, 1))
        .at(ctr.advance(0.4).now()).effect(decoratedPipeline(dmgPipeline, 2));

timeline.runTo(3.0);
