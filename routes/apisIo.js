'use strict';

var express = require('express');
var router = express.Router();

var utils = require('./utils');

router.get('/', function (req, res, next) {
    var glob = utils.loadGlobals(req.app);
    var envVars = utils.loadEnvDict(req.app);

    var today = new Date();
    var todayStr = today.getFullYear() + '-' +
        ("0" + (today.getMonth() + 1)).slice(-2) + '-' +
        ("0" + today.getDate()).slice(-2);

    var skeleton;
    if (!glob.apisIo.skeleton) {
        skeleton = {
        };        
    } else {
        skeleton = JSON.parse(glob.apisIo.skeleton);
    }

    if (skeleton.maintainers == undefined) {
        if (glob.mailer.useMailer) {
            skeleton.maintainers = [
                {
                    FN : glob.mailer.adminName,
                    email : glob.mailer.adminEmail,
                }
            ]
        }
    }

    glob.apisIo.skeleton = JSON.stringify(skeleton, null, 2);

    utils.mixinEnv(glob, envVars);
    res.render('apisIo',
        {
            configPath: req.app.get('config_path'),
            glob: glob
        });
});

router.post('/', function (req, res, next) {
    var redirect = req.body.redirect;
    // console.log(req.body);
    var glob = utils.loadGlobals(req.app);
    var envVars = utils.loadEnvDict(req.app);

    var body = utils.jsonifyBody(req.body);
    glob.apisIo = body.glob.apisIo;

    utils.mixoutEnv(glob, envVars);

    utils.saveGlobals(req.app, glob);
    utils.saveEnvDict(req.app, envVars, "default");

    // Write changes to Kickstarter.json
    var kickstarter = utils.loadKickstarter(req.app);
    kickstarter.kongAdapter = 3;
    utils.saveKickstarter(req.app, kickstarter);

    res.redirect(redirect);
});

module.exports = router;
