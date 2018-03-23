'use strict';

var express = require('express');
var router = express.Router();
var yaml = require('js-yaml');

var utils = require('./utils');

router.get('/:apiId', function (req, res, next) {
    var apiId = req.params.apiId;
    var swagger = utils.loadApisJson(req.app, apiId);
    var swaggerText = JSON.stringify(swagger, null, 4);
    res.render('apisjson',
        {
            configPath: req.app.get('config_path'),
            envFile: req.app.get('env_file'),
            apiId: apiId,
            swagger: swaggerText
        });
});

router.post('/:apiId', function (req, res, next) {
    var redirect = req.body.redirect;
    var apiId = req.params.apiId;

    var swagger = '';
    try {
        swagger = JSON.parse(req.body.swagger);
    } catch (err) {
        // If we ran into trouble, we'll try YAML
        try {
            swagger = yaml.safeLoad(req.body.swagger);
        } catch (err) {
            return next(err);
        }
    }
    
    // We could parse it, then it will be okayish.
    utils.saveApisJson(req.app, apiId, swagger);

    res.redirect(redirect);
});

module.exports = router;
