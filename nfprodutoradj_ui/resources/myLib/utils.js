"use strict";
sap.ui.define([], function () {
	"use strict";

	return {
	deepClone: function (obj, hash = new WeakMap())  {
			if (Object(obj) !== obj) {
				return obj;
			} // primitives
			if (hash.has(obj)) {
				return hash.get(obj);
			} // cyclic reference
			const result = obj instanceof Set ? new Set(obj) // See note about this!
				: obj instanceof Map ? new Map(Array.from(obj, ([key, val]) => [key, this.deepClone(val, hash)])) : obj instanceof Date ? new Date(
					obj) : obj instanceof RegExp ? new RegExp(obj.source, obj.flags)
				// ... add here any specific treatment for other classes ...
				// and finally a catch-all:
				: obj.constructor ? new obj.constructor() : Object.create(null);
			hash.set(obj, result);
			return Object.assign(result, ...Object.keys(obj).map(
				key => ({
					[key]: this.deepClone(obj[key], hash)
				})));
		},
		find: function (index, data) {
			for (var i = 0; i < data.length; i++) {
				if (data[i].Id == index) {
					return data[i].Name;
				}
			}
			return "";
		},
	monthDiff: function (d1, d2) {
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
},
daysBetween: function (first, second) {

    // Copy date parts of the timestamps, discarding the time parts.
    var one = new Date(first.getFullYear(), first.getMonth(), first.getDate());
    var two = new Date(second.getFullYear(), second.getMonth(), second.getDate());

    // Do the math.
    var millisecondsPerDay = 1000 * 60 * 60 * 24;
    var millisBetween = two.getTime() - one.getTime();
    var days = millisBetween / millisecondsPerDay;

    // Round down.
    return Math.floor(days);
}
	};

});