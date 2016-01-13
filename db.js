var elasticsearch = require('elasticsearch');

var log = require("./log");
var config = require("./config");
var host = config.get("elasticsearch").host;

var client;
client = new elasticsearch.Client({
    apiVersion: "2.1",
    host: host
});

module.exports.assertConnection = function () {
    client.ping({}, function (error) {
        if (error) {
            log.error("Failed to connect to ElasticSearch at " + host);
            log.error(error);
            process.exit(1);
        } else {
            log.info("Connected to ElasticSearch at " + host);
        }
    });
};

module.exports.setupDb = function () {
    client.indices.get({
        index: "scrum"
    }, function (err, response, status) {
        if (status == 404) {
            log.info("Setting up ElasticSearch index: scrum");
            client.indices.create({
                index: "scrum",
                body: {
                    mappings: {
                        "_default_": {
                            properties: {
                                //raw: { type: "string", analyzer: "standard" },
                                startTime: {type: "date"},
                                endTime: {type: "date"},
                                participants: {type: "string", index: "not_analyzed"},
                                issues: {type: "string", index: "not_analyzed"}
                            }
                        }
                    }
                }
            }, function (err, response, status) {
                if (err) {
                    log.error("Error setting up 'scrum' index!");
                    log.error(err);
                }
                else {
                    log.info("Done.");
                }
            });
        } else {
            log.debug("ElasticSearch index for 'scrum' already configured");
        }
    });
};

module.exports.recordScrum = function (processedScrum) {
    //client.ping({}, function(error) {
    //    if (error) {
    //        log.error("Failed to connect to ElasticSearch at " + host);
    //        log.error(error);
    //        // should send a message to the IRC channel here
    //    }
    //});

    client.index({
        index: "scrum",
        type: "conversation",
        body: processedScrum
    }, function (err, response) {
        if (err) {
            log.error("Failed to index in ElasticSearch");
            log.error(err);
        } else {
            log.info("Recorded in ElasticSearch");
        }
    });
};