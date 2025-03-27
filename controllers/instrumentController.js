const Instrument = require('../models/Instrument');

exports.getInstruments = async (req, res) => {
  try {
    const instruments = await Instrument.find();
    res.json(instruments);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching instruments' });
  }
};

exports.addInstrument = async (req, res) => {
  try {
    const instrument = new Instrument(req.body);
    await instrument.save();
    res.status(201).json(instrument);
  } catch (error) {
    res.status(400).json({ error: 'Error adding instrument' });
  }
};

