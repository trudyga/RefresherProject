/**
 * Created by Середа on 13.03.2017.
 */

let chai = require('chai');
let sinon = require('sinon');
let expect = chai.expect;

let Sheduler = require('../../../src/background/Entities/core/sheduler.js');

describe("Sheduler test", function() {
    describe("#constructor()", function () {
       it("requires date and 2 numerical values", function () {
           chai.expect(() => {new Sheduler();})
               .to.throw(Error);

           chai.expect(() => {new Sheduler(1, 1, 1);})
               .to.throw(Error);

           chai.expect(() => {new Sheduler(new Date(), 'foo', 'bar');}).
               to.throw(Error);

           chai.expect(() => {new Sheduler({}, 1, 1);})
               .to.throw(Error);

           chai.expect(() => {new Sheduler(new Date(), 10000, 10000);})
               .to.not.throw(Error);
       });

       it("requires refreshTime and durationTime to be >= 0", function () {
           chai.expect(() => {new Sheduler(new Date, -10, 0);})
               .to.throw(Error);

           chai.expect(() => {new Sheduler(new Date, -10, -10);})
               .to.throw(Error);

           chai.expect(() => {new Sheduler(new Date, 0, 0);})
               .to.not.throw(Error);
       });

       describe("Initialize time list", function () {
           let clock;

           beforeEach(() => {
                   clock = sinon.useFakeTimers();
               }
           );

           it("Should create 1 record in time list if refresh time is 0", function() {
               // sheduler if refresh time set 0
               let initTime = new Date();
               let sheduler = new Sheduler(initTime, 0 , 10000);

               expect(sheduler.timeList.length).to.equal(1);
           });

           it("Should create 1 record in time list if duration time is 0", function () {
              let initTime = new Date();
              let sheduler = new Sheduler(initTime, 10, 0);

              expect(sheduler.timeList.length).to.equal(1);
           });

           it("Should create n+1 records in time if refresh time is 1/n of duration time", function () {
               let initTime = new Date();
               let sheduler;

               for (let n = 1; n <= 10; n++) {
                   sheduler = new Sheduler(initTime, 1, n);
                   expect(sheduler.timeList.length).to.equal(n+1);
               }
           });

           it("Should create correct data values in time list", function () {
              let initTime = new Date(1);
              let refreshTime = 1000;
              let duration = 3000;
              let sheduler = new Sheduler(initTime, refreshTime, duration);

              let expectedTimeList = [new Date(initTime.valueOf()), new Date(initTime.valueOf() + 1000), new Date(initTime.valueOf() + 2000),
              new Date(initTime.valueOf() + 3000)];

              expect(sheduler.timeList).to.deep.include.members(expectedTimeList);
           });

           afterEach(() => {
              clock.restore();
           });
       });
    });

    describe("#initialTime", function () {
        let sheduler;
        beforeEach(() => {
            let initTime = new Date(
            2017, 0, 1);
            sheduler = new Sheduler(initTime, 1000, 3000);
        });

        it('returns the initial time', function () {
            let difference = sheduler.initialTime -
                    new Date(2017, 0,1);
            chai.expect(difference).to.equal(0);
        });
    });

    describe("#refreshTime", function() {
        let sheduler;
        beforeEach(() => {
            let initTime = new Date(
                2017, 0, 1);
            sheduler = new Sheduler(initTime, 1000, 3000);
        });

        it('returns the refresh time', function() {
            chai.expect(sheduler.refreshTime).to.equal(1000);
        });
    });

    describe("#duration", function () {
        let sheduler;
        beforeEach(() => {
            let initTime = new Date(
                2017, 0, 1);
            sheduler = new Sheduler(initTime, 1000, 3000);
        });

        it('returns the duration time', function () {
           chai.expect(sheduler.duration).to.equal(3000);
        });
    });

    describe("#state", function () {
       it('Should return current state in boolean format', function () {
          let sheduler = new Sheduler(new Date(), 1, 1);

          expect(sheduler.state).to.be.false;
       });
    });

    describe("#timeList", function () {
        let sheduler = new Sheduler(new Date(0,0,0), 1000, 3000);

        it('returns the mass of dates', function () {
            chai.expect(Array.isArray(sheduler.timeList)).to.equal(true);

            for(let date of sheduler.timeList) {
                chai.expect(date).to.be.instanceof(Date);
            }
        });
    });

    describe("#timeToNextAction", function() {
        let clock;
        let sheduler, initTime, refreshTime, duration;
        beforeEach(() => {
            //it makes face timers
            clock = sinon.useFakeTimers();

            initTime = new Date(10000);
            refreshTime = 2000;
            duration = 6999;
            sheduler = new Sheduler(initTime, refreshTime, duration);
        });

        it("Should return initial time if current time is less then initial time", function () {
            //act
            let nextActionTime = sheduler.timeToNextAction;

            //assert
            expect(nextActionTime).to.be.equal(10000);
        });

        it("Should return 0 if current time surpassed duration period", function () {
            clock.tick(20000);
            let nextActionTime = sheduler.timeToNextAction;

            expect(nextActionTime).to.be.equal(0);
        });
        
        it("Should return next time from timeList if current time is within (initialTime; initialTime + duration)", function () {
            clock.tick(10002);

            let nextActionTime = sheduler.timeToNextAction;

            expect(nextActionTime).to.be.equal(1998);
            clock.tick(2001);
            expect(sheduler.timeToNextAction).to.be.equal(1997);
        });


        afterEach(() => {
            clock.restore();
        })
    });

    describe("#addActionHandler", function() {
        let sheduler;

        beforeEach(() => {
            sheduler = new Sheduler(new Date(),0 ,0);
        });

        it("Throw an error if not function passed", function () {
            expect(() => {sheduler.addActionHandler({});}).to.throw(Error);
        });

        it("If function has passed, return true", function () {
            expect(() => {sheduler.addActionHandler(() => {});}).to.not.throw(Error);
            expect(sheduler.addActionHandler(() => {})).to.be.true;
        });

        afterEach(function () {
           sheduler = null;
        });
    });

    describe("#start", function () {
        let sheduler, refreshTime, clock, start;
        beforeEach(function () {
            refreshTime = 1000;
            sheduler = new Sheduler(new Date(), refreshTime, 10000);
            clock = sinon.useFakeTimers();
            start = sinon.spy(sheduler, 'trigger');
        });

       it("Start function should trigger onAction event", sinon.test(function () {
           sheduler.start();
           clock.tick(sheduler.timeToNextAction);

           expect(start.calledOnce).to.be.true;
           expect(start.alwaysCalledWith('onAction')).to.be.true;
       }));

       it("Should trigger event every time in list", sinon.test(function () {
           sheduler.start();
           clock.tick(sheduler.timeToNextAction);

           expect(start.calledOnce).to.be.true;
           expect(start.alwaysCalledWith('onAction')).to.be.true;

           clock.tick(sheduler.timeToNextAction);

           expect(start.calledOnce).to.be.true;
           expect(start.alwaysCalledWith('onAction')).to.be.true;
       }));

       it("Should not trigger event if time doesn't passed", sinon.test(function () {
           sheduler.start();
           clock.tick(800);

           expect(start.called).to.be.false;
       }));

       it("Should change current state to be true", sinon.test(function () {
           sheduler.start();

           expect(sheduler.state).to.be.true;
       }));

       afterEach(function () {
           sheduler.stop();
           sheduler = null;
           clock.restore();
           start.restore();
       })
    });
});