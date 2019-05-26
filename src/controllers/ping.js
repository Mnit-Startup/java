exports.get = [
  (req, res) => {
    const welcome = res.__('hello');
    res.send(welcome);
  },
];
