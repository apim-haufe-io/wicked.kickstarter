'use strict';

/* global alert, btoa, Vue, $ */

function randomId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function showEnvVar(envVarNameIncludingDollar) {
    // alert('show env var ' + envVarName);
    let envVarName = envVarNameIncludingDollar.substring(1);
    if (envVarName.startsWith('{') && envVarName.endsWith('}'))
        envVarName = envVarName.substring(1, envVarName.length - 1);
    $.getJSON('/api/envs?env_var=' + envVarName).fail(function () {
        alert('Could not retrieve env var from backend.');
    }).done(function (data) {
        $('#modalTitle').text('Env var ' + envVarName);
        let tabs = `<li class="active"><a data-toggle="tab" href="#tab_default">default</a></li>`;
        let content = `
            <div class="tab-pane fade in active" id="tab_default">
                <div class="panel-content">
                    <p></p>
                    <p>${data.envs['default'].defined ? '<code>' + data.envs['default'].value.value + '</code>' : '(undefined)'}</p>
                    <p><a target="_blank" href="/envs/default">Open environment &quot;default&quot;</a>.</p>
                </div>
            </div>`;
        for (let e in data.envs) {
            if (e === 'default')
                continue;
            tabs += `<li><a data-toggle="tab" href="#tab_${e}">${e}</a></li>`;
            content += `
                <div class="tab-pane fade" id="tab_${e}">
                    <div class="panel-content">
                        <p></p>
                        <p>${data.envs[e].defined && data.envs[e].value.inherited ? 'Inherited from <code>default</code>.' : ''}</p>
                        <p>${data.envs[e].defined ? '<code>' + data.envs[e].value.value + '</code>' : '(undefined)'}</p>
                        <p><a target="_blank" href="/envs/${e}">Open environment &quot;${e}&quot;</a>.</p>
                        </div>
                </div>`;
        }
        $('#modalContent').html(`
            <ul class="nav nav-tabs">
                ${tabs}
            </ul>
      
            <div class="tab-content">
                ${content}
            </div>
          `);
        $('#modalDialog').modal();
    });
}

function makeEnvVar(envVarName, value, callback) {
    $.ajax({
        method: 'POST',
        url: '/api/envs/default',
        data: {
            name: envVarName,
            value: value,
            encrypted: true
        }
    }).fail(function (err) {
        return callback(err);
    }).done(function () {
        return callback(null);
    });
}

function showEnvExplanation() {
    alert('This input value can, or should not, be provided as an environment variable.');
}

Vue.component('wicked-panel', {
    props: {
        type: String,
        title: String,
        open: {
            type: Boolean,
            default: false
        }
    },
    data: function () {
        // alert('open: ' + this.open + '( ' + this.title + ')');
        const isOpen = this.open;
        return {
            isOpen: isOpen,
            internalId: randomId()
        };
    },
    template: `
        <div :class="'panel panel-' + type">
            <div class="panel-heading">
                <h4 class="panel-title">
                    <a data-toggle="collapse" :href="'#' + internalId">{{ title + ' &#x21E9;' }}</a>
                </h4>
            </div>
            <div :id="internalId" :class="{ collapse: true, 'panel-collapse': true, in: isOpen }">
                <div class="panel-body">
                    <slot></slot>
                </div>
            </div>
        </div>
    `
});

Vue.component('wicked-input', {
    props: ['label', 'readonly', 'value', 'envVar', 'hint', 'textarea', 'json', 'height'],
    data: function () {
        const isReadOnly = typeof this.readonly !== 'undefined';
        const isTextarea = typeof this.textarea !== 'undefined';
        const isJson = typeof this.json !== 'undefined';
        const envVarName = typeof this.envVar === 'string' && this.envVar !== '' ? this.envVar : null;
        const textareaHeight = typeof this.height === 'string' && this.height !== '' ? this.height : '100px';
        return {
            internalId: randomId(),
            isReadOnly: isReadOnly,
            isTextarea: isTextarea,
            textareaHeight: textareaHeight,
            isJson: isJson,
            isValidJson: true,
            envVarName: envVarName
        };
    },
    computed: {
        showEnvVar: function () {
            if (!this.envVarName)
                return false;
            if (this.isReadOnly)
                return false;
            if (this.hasEnvVar)
                return false;
            return true;
        },
        hasEnvVar: function () {
            if (this.value && typeof this.value === 'string')
                return this.value.startsWith('$');
            return false;
        }
    },
    methods: {
        makeVar: function (event) {
            const instance = this;
            makeEnvVar(this.envVarName, this.value, function (err) {
                if (err) {
                    alert('Could not create env var in environment "default": ' + err.message);
                    console.error(err);
                    return;
                }
                // Replace with env var name instead; this looks counterintuitive, but works.
                instance.$emit('input', `\${${instance.envVarName}}`);
            });
        },
        showVar: function (event) {
            showEnvVar(this.value);
        },
        showExplanation: function (event) {
            showEnvExplanation();
        },
        verifyValue: function (value) {
            if (this.isJson) {
                try {
                    JSON.parse(value);
                    this.isValidJson = true;
                } catch (err) {
                    this.isValidJson = false;
                }
            }
            this.$emit('input', value);
        }
    },
    template: `
        <div class="form-group">
            <label :for="internalId"><span v-html="label"></span></label>
            <div v-if="!isTextarea" class="input-group">
                <input :id="internalId" class="form-control"
                    type="text"
                    :readonly=readonly
                    v-bind:value="value"
                    v-on:input="$emit('input', $event.target.value)"
                >
                <span class="input-group-btn">
                    <button v-if="showEnvVar" class="btn btn-warning" v-on:click="makeVar">Make ENV var</button>
                    <button v-else-if="hasEnvVar" class="btn btn-success" v-on:click="showVar">Show ENV var</button>
                    <button v-else class="btn btn-default" v-on:click="showExplanation">?</button>
                </span>
            </div>
            <div v-if="isTextarea" class="form-group">
                <textarea :id="internalId" 
                          class="form-control"
                          :readonly=readonly
                          :value="value"
                          :style="'height:' + textareaHeight"
                          v-on:input="verifyValue($event.target.value)"
                >{{ value }}</textarea>
                <p v-if="isJson && !isValidJson"><span style="color:red; font-weight:bold;">ERROR:</span> Content is not valid JSON.</p>
                <div v-if="!isJson">
                    <p></p>
                    <button v-if="showEnvVar" class="btn btn-warning" v-on:click="makeVar">Make ENV var</button>
                    <button v-else-if="hasEnvVar" class="btn btn-success" v-on:click="showVar">Show ENV var</button>
                </div>
            </div>
            <div v-if="hint !== null">
                <span class="wicked-note" v-html="hint"></span>
            </div>
        </div>
    `
});

Vue.component('wicked-checkbox', {
    props: ['value', 'label'],
    template: `
        <div class="checkbox">
            <label>
                <input v-bind:checked="value" v-on:change="$emit('input', $event.target.checked)" type="checkbox"><span v-html="label"></span></input>
            </label>
        </div>
    `
});

Vue.component('wicked-plugins', {
    props: ['value', 'hint', 'serverId', 'disableAwsLambda', 'disableCors'],
    data: function () {
        const envPrefix = 'PORTAL_AUTHSERVER_' + this.serverId.toUpperCase() + '_PLUGINS_';
        const disableAwsLambda = typeof this.disableAwsLambda !== 'undefined';
        const disableCors = typeof this.disableCors !== 'undefined';
        return {
            envPrefix: envPrefix,
            username: '',
            password: '',
            hideAwsLambda: disableAwsLambda,
            hideCors: disableCors
        };
    },
    methods: {
        getPanelType: function (enabled) {
            return enabled ? 'success' : 'info';
        },
        addHeader: function (header) {
            try {
                const otherPlugins = JSON.parse(this.value.others.config);
                if (!Array.isArray(otherPlugins))
                    throw new Error('Plugin configuration must be an array.');

                let reqTransformer = null;
                for (let i = 0; i < otherPlugins.length; ++i) {
                    const pl = otherPlugins[i];
                    if (pl.name == 'request-transformer') {
                        reqTransformer = pl;
                        break;
                    }
                }
                if (!reqTransformer) {
                    reqTransformer = {
                        name: 'request-transformer'
                    };
                    otherPlugins.push(reqTransformer);
                }
                if (!reqTransformer.config)
                    reqTransformer.config = {};
                const config = reqTransformer.config;
                if (!config.add)
                    config.add = {};
                const add = config.add;
                if (!add.headers)
                    add.headers = [];
                const headers = add.headers;
                headers.push(header);

                this.value.others.config = JSON.stringify(otherPlugins, null, 2);
                return true;
            } catch (err) {
                alert('Cannot add header; plugin configuration is possibly not a valid JSON object: ' + err.message);
                return false;
            }
        },
        addForwarded: function () {
            this.addHeader("%%Forwarded");
        },
        addBasicAuth: function () {
            try {
                const base64Creds = btoa(this.username + ':' + this.password);
                const headerText = 'Authorization:Basic ' + base64Creds;
                const envVarName = this.envPrefix + 'BASICAUTH';

                const instance = this;
                $.ajax({
                    method: 'POST',
                    url: '/api/envs/default',
                    data: {
                        name: envVarName,
                        value: headerText,
                        encrypted: true
                    }
                }).done(function () {
                    instance.addHeader('$' + envVarName);
                });
            } catch (err) {
                alert('An error occurred. Possibly your browser does not support "btoa". The exception: ' + err.message);
            }
        }
    },
    template: `
        <wicked-panel title="Plugin Configuration" type="danger" :open=true>
            <p>{{ hint }}</p>
            <wicked-panel title="Rate Limiting" :type="getPanelType(value.rate_limiting.useRateLimiting)">
                <p>One of these fields must be filled (we won't check, but it will fail when deploying).
                Prefer shorter periods over longer periods in case you might need to redeploy/re-init
                the Kong database. That would result in reset rate limiting periods.
                <strong>Recommendation:</strong> Stick to hours or smaller.</p>
                <wicked-checkbox v-model="value.rate_limiting.useRateLimiting" label="<strong>Use Rate Limiting Plugin</strong>" />
                <wicked-input v-model="value.rate_limiting.config.second" label="Requests per second:" />
                <wicked-input v-model="value.rate_limiting.config.minute" label="Requests per minute:" />
                <wicked-input v-model="value.rate_limiting.config.hour" label="Requests per hour:" />
                <wicked-input v-model="value.rate_limiting.config.day" label="Requests per day:" />
                <wicked-input v-model="value.rate_limiting.config.year" label="Requests per year:" />
                <hr>
                <h4>Additional Settings</h4>
                <wicked-checkbox v-model="value.rate_limiting.config.fault_tolerant" label="<strong>Fault tolerant:</strong> Proxy requests even if Kong cannot reach its DB." />
            </wicked-panel>
            <wicked-panel title="Correlation ID" :type="getPanelType(value.correlation_id.useCorrelationId)">
                <p>Use the Correlation ID plugin to introduce a correlation ID by the API Gateway; this can be
                useful when tracking and debugging requests to your backend, to see which request passes through
                which systems at which time. This is a highly recommended plugin.</p>
                <wicked-checkbox v-model="value.correlation_id.useCorrelationId" label="Use the correlation ID plugin" />
                <wicked-input v-model="value.correlation_id.config.header_name" label="Header Name" hint="The name of the header to pass the ID in." :env-var="envPrefix + 'CORR_HEADER'" />
                <label>Correlation ID Generator:</label>
                <select v-model="value.correlation_id.config.generator" class="form-control">
                    <option>uuid#counter</option>
                    <option>uuid</option>
                </select>
                <wicked-checkbox v-model="value.correlation_id.config.echo_downstream" label="<strong>Echo ID downstream</strong>: Check to echo the correlation ID back to the calling client." />
            </wicked-panel>
            <wicked-panel v-if="!hideCors" title="CORS" :type="getPanelType(value.cors.useCors)">
                <p>Use the CORS plugin to enable Cross Origin Request Sharing on your API. If you don't use
                CORS, you will not be able to call your API from a browser. Which may be exactly what you do
                not want. For machine to machine communication, enabling this is <strong>not required</strong>
                and definitely <strong>not recommended</strong>.</p>
                <wicked-checkbox v-model="value.cors.useCors" label="<strong>Use the CORS plugin</strong>" />

                <wicked-input v-model="value.cors.config.origins" label="Access-Control-Allow-Origin:" hint="Allowed origins; to allow all origins, specify <code>*</code>" :env-var="envPrefix + 'CORS_ORIGINS'" />
                <wicked-input v-model="value.cors.config.methods" label="Access-Control-Allow-Methods" hint="Value for the <code>Access-Control-Allow-Methods</code> header, expects a comma delimited string (e.g. GET,POST). Defaults to GET,HEAD,PUT,PATCH,POST,DELETE." :env-var="envPrefix + 'CORS_METHODS'" />
                <wicked-input v-model="value.cors.config.headers" label="Access-Control-Allow-Headers" hint="Value for the <code>Access-Control-Allow-Headers</code> header, expects a comma delimited string (e.g. <code>Origin,Authorization</code>). Defaults to the value of the <code>Access-Control-Request-Headers</code> header." :env-var="envPrefix + 'CORS_HEADERS'" />
                <wicked-input v-model="value.cors.config.exposed_headers" label="Access-Control-Expose-Headers" hint="Value for the <code>Access-Control-Expose-Headers</code> header, expects a comma delimited string (e.g. <code>Origin,Authorization</code>). If not specified, no custom headers are exposed." :env-var="envPrefix + 'CORS_EXPOSE_HEADERS'" />
                <wicked-checkbox v-model="value.cors.config.credentials" label="<strong>Access-Control-Allow-Credentials</strong>: Flag to determine whether the Access-Control-Allow-Credentials header should be sent with true as the value. Defaults to false." />
                <wicked-input v-model="value.cors.config.max_age" label="Preflight Max Age (seconds):" hint="Indicates how long the results of the preflight request can be cached, in seconds." />
                <wicked-checkbox v-model="value.cors.config.preflight_continue" label="<strong>Proxy OPTIONS to backend</strong>: A boolean value that instructs the plugin to proxy the <code>OPTIONS</code> preflight request to the upstream API. Defaults to <code>false</code>." />
            </wicked-panel>
            <wicked-panel v-if="!hideAwsLambda" title="AWS Lambda" :type="getPanelType(value.aws_lambda.useAwsLambda)">
                <p>All of these fields must be filled (we won't check, but it will fail when deploying).</p>
                <wicked-input v-model="value.aws_lambda.config.aws_key" label="AWS Key:" :env-var="envPrefix + 'AWS_KEY'" />
                <wicked-input v-model="value.aws_lambda.config.aws_secret" label="AWS Secret:" :env-var="envPrefix + 'AWS_SECRET'" />
                <wicked-input v-model="value.aws_lambda.config.aws_region" label="AWS Region:" :env-var="envPrefix + 'AWS_REGION'" />
                <wicked-input v-model="value.aws_lambda.config.function_name" label="Function name:" :env-var="envPrefix + 'AWS_FUNCTION'" />
            </wicked-panel>
            <wicked-panel title="Other plugins" :type="getPanelType(value.others.useOthers)">
                <p>This wicked Kickstarter application only has direct support for a few of Kong's plugins.
                You can, by editing the following JSON snippet, configure all other plugins according to
                the <a href='https://getkong.org/plugins/' target='_blank'>plugin documentation at Mashape</a>. 
                Kickstarter will unfortunately not really help you with it. The input area will expect a
                JSON array of plugin configuration, as described at Kong's documentation pages.</p>
                <p><strong>Important Note</strong>: You must not try to use any of the following plugins, as they
                are used under the hood by wicked to achieve the subscription mechanisms:</p>
                <ul>
                    <li><strong>Access Control Lists</strong> (ACL)</li>
                    <li><strong>Key Authentication</strong> (<code>key-auth</code>)</li>
                    <li><strong>OAuth2</strong> (<code>oauth2</code>)</li>
                </ul>
                <wicked-panel title="Toolbox" type="success" :open=false>
                    <h5>Add <code>Forwarded</code> header</h5>
                    <button v-on:click="addForwarded" class="btn btn-success btn-sm">Add Forwarded Header</button>
                    <hr>
                    <h5>Add an upstream "Basic Auth" header</h5>
                    <p>This functionality will add a header, and simultaneously add an env var (see <a href="/envs/default" target="_blank">environments</a>)
                       to hold the (encrypted) credentials.</p>
                    <p><table width="100%">
                        <tr>
                            <td>
                                <label>Username:</label>
                                <input v-model="username" type="text" class="form-control" placeholder="Enter username" />
                            </td>
                            <td style="padding-left: 5px;">
                                <label>Password:</label>
                                <input v-model="password" type="text" class="form-control" placeholder="Enter password" />
                            </td>
                        </tr>
                    </table></p>
                    <p><button v-on:click="addBasicAuth" class="btn btn-success btm-sm">Add Authentication Header</button></p>
                </wicked-panel>
                <wicked-checkbox v-model="value.others.useOthers" label="<strong>Use other plugins</strong>" />
                <wicked-input v-model="value.others.config" :textarea=true :json=true label="Plugin configuration (plugin array):" height="400px" />
    
            </wicked-panel>
        </wicked-panel>
    `
});