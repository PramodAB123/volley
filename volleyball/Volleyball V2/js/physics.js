// Ball flight maths. Positions are in metres: x along the court, y across,
// z height. Every hit is a projectile solved from start to target over T seconds.
(function () {
  var G = SR.COURT.G;

  SR.phys = {
    // Velocity that takes the ball from p0 to p1 in exactly T seconds.
    solve: function (p0, p1, T) {
      return { x: (p1.x - p0.x) / T, y: (p1.y - p0.y) / T, z: (p1.z - p0.z + 0.5 * G * T * T) / T };
    },
    at: function (p0, v, t) {
      return { x: p0.x + v.x * t, y: p0.y + v.y * t, z: p0.z + v.z * t - 0.5 * G * t * t };
    },
    vel: function (v, t) {
      return { x: v.x, y: v.y, z: v.z - G * t };
    },
    speed: function (v) {
      return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    },
    // Last (descending) time the ball is at height h, or null if it never gets there.
    timeAtHeight: function (p0, v, h) {
      var a = -0.5 * G, b = v.z, c = p0.z - h, disc = b * b - 4 * a * c;
      if (disc < 0) return null;
      var s = Math.sqrt(disc), t = Math.max((-b - s) / (2 * a), (-b + s) / (2 * a));
      return t > 0 ? t : null;
    },
    // Time the ball crosses the plane x = X, or null if it never does.
    crossX: function (p0, v, X) {
      if (Math.abs(v.x) < 1e-6) return null;
      var t = (X - p0.x) / v.x;
      return t > 0 ? t : null;
    },
    // Smallest flight time >= T0 whose path clears the net with a margin.
    clearNet: function (p0, p1, T0, margin) {
      var T = T0;
      for (var i = 0; i < 30; i++) {
        var v = this.solve(p0, p1, T), tc = this.crossX(p0, v, SR.COURT.NET_X);
        if (tc === null || tc > T) return T;
        if (this.at(p0, v, tc).z >= SR.COURT.NET_H + margin) return T;
        T *= 1.08;
      }
      return T;
    }
  };
})();
