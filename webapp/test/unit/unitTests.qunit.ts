// https://api.qunitjs.com/config/autostart/
QUnit.config.autostart = false;

// import all your QUnit tests here
void Promise.all([
	import("unit/service/JourneyStorage.service.qunit"), 
	import("unit/class/Journey.class.qunit")]).then(() => {
	QUnit.start();
});
