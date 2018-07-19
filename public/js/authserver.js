Vue.component('auth-server-basic', {
    props: ['value', 'envPrefix'],
    template: `
    <wicked-panel title="Basic Configuration" type="primary" :open=true>
        <wicked-input v-model="value.id" label="Name:" readonly=true disallow-env-var=true />
        <wicked-input v-model="value.desc" label="Description:" :env-var="envPrefix + 'DESC'" hint="Friendly description of the Authorization Server. Displayed on the API description page for APIs using this Server." />
        <wicked-input v-model="value.config.api.upstream_url" label="Upstream (backend) URL:" :env-var="envPrefix + '_UPSTREAM_URL'" />
    </wicked-panel>
    `
});

Vue.component('auth-method', {
    props: ['value', 'serverName'],
    data: function () {
        const envPrefix = 'PORTAL_AUTHMETHOD_' + this.serverName.toUpperCase() + '_' + this.value.name.toUpperCase() + '_';
        return {
            envPrefix: envPrefix
        };
    },
    template:
    `
    <wicked-panel :open=false :type="value.enabled ? 'success': 'warning'" :title="(value.useForPortal ? '✓ ' : '') + value.friendlyShort + ' (' + value.name + ', type ' + value.type + ')'">
        <wicked-checkbox v-model="value.enabled" label="Enabled" />
        <wicked-checkbox v-model="value.useForPortal" label="Allow for Portal/wicked login" />
        <wicked-input v-model="value.type" label="Type:" :readonly=true />
        <wicked-input v-model="value.name" label="Method ID:" disallow-env-var=true />
        <wicked-input v-model="value.friendlyShort" label="Friendly short name of this auth method:" :env-var="envPrefix + 'SHORTDESC'"></wicked-input>
        <wicked-input v-model="value.friendlyLong" label="Longer friendly description of this auth method:" :env-var="envPrefix + 'LONGDESC'"></wicked-input>

        <hr>

        <div v-if="value.type == 'local'">
            <wicked-checkbox v-model="value.config.trustUsers" label="Trust user email addresses (only for internal use)" />
            <wicked-checkbox v-model="value.config.disableSignup" label="Disable interactive signup for new users" />
        </div>
        <div v-else-if="value.type == 'google'">
            <wicked-input v-model="value.config.clientId" label="Google client ID:" hint="The Google client ID for the wicked API Portal" :env-var="envPrefix + 'CLIENTID'"/>
            <wicked-input v-model="value.config.clientSecret" label="Google client Secret:" hint="The Google client secret for the wicked API Portal" :env-var="envPrefix + 'CLIENTSECRET'"/>
        </div>
        <div v-else-if="value.type == 'github'">
            <wicked-input v-model="value.config.clientId" label="Github client ID:" hint="The Github client ID for the wicked API Portal" :env-var="envPrefix + 'CLIENTID'"/>
            <wicked-input v-model="value.config.clientSecret" label="Github client Secret:" hint="The Github client secret for the wicked API Portal" :env-var="envPrefix + 'CLIENTSECRET'"/>
        </div>
        <div v-else-if="value.type == 'twitter'">
            <wicked-input v-model="value.config.consumerKey" label="Twitter consumer key:" hint="The Twitter consumer key for the wicked API Portal" :env-var="envPrefix + 'CONSUMERKEY'" />
            <wicked-input v-model="value.config.consumerSecret" label="Twitter consumer secret:" hint="The Twitter consumer secret for the wicked API Portal" :env-var="envPrefix + 'CONSUMERSECRET'" />
        </div>
        <div v-else-if="value.type == 'oauth2'">
            <wicked-checkbox v-model="value.config.trustUsers" label="Trust user email addresses from this source (maps to <code>email_verified</code>)" />
            <wicked-input v-model="value.config.clientId" label="OAuth2 client ID:" hint="The OAuth2 client ID for the wicked API Portal" :env-var="envPrefix + 'CLIENTID'" />
            <wicked-input v-model="value.config.clientSecret" label="OAuth2 client Secret:" hint="The OAuth2 client secret for the wicked API Portal" :env-var="envPrefix + 'CLIENTSECRET'" />
            <wicked-input v-model="value.config.endpoints.authorizeEndpoint" label="Authorize endpoint of OAuth2 server:" hint="The authorization endpoint of the upstream OAuth2 server" :env-var="envPrefix + 'AUTHORIZE_URL'" />
            <wicked-input v-model="value.config.endpoints.tokenEndpoint" label="Token endpoint of OAuth2 server:" hint="The token endpoint of the upstream OAuth2 server" :env-var="envPrefix + 'TOKEN_URL'" />
            <wicked-input v-model="value.config.endpoints.profileEndpoint" label="Profile endpoint of OAuth2 server:" hint="The profile endpoint of the upstream OAuth2 server" :env-var="envPrefix + 'PROFILE_URL'" />
            <wicked-input v-model="value.config.endpoints.authorizeScope" label="Authorization scope:" hint="Space separated scopes for authorization, e.g. <code>profile email</code>" :env-var="envPrefix + 'SCOPE'" />
            <wicked-checkbox v-model="value.config.retrieveProfile" label="Retrieve profile from profile endpoint (must be specified, assumed to be OIDC compliant); IF NOT: Token is assumed to be a JWT, please specify mapping below" />
            <hr>
            <wicked-input v-model="value.config.customIdField" label="JWT claim: Unique ID:" hint="REQUIRED: The JWT claim containing a unique ID from the remote IdP/OAuth2 server; usually <code>sub</code>" :env-var="envPrefix + 'FIELD_CUSTOMID'" />
            <wicked-input v-model="value.config.nameField" label="JWT Claim: Display name (full name):" hint="OPTIONAL: The JWT claim containing the full name/display name of the user (<code>name</code>)" :env-var="envPrefix + 'FIELD_NAME'" />
            <wicked-input v-model="value.config.firstNameField" label="JWT Claim: First/given name:" hint="OPTIONAL: The JWT claim containing the first/given name of the user (<code>given_name</code>)" :env-var="envPrefix + 'FIELD_FIRSTNAME'" />
            <wicked-input v-model="value.config.lastNameField" label="JWT Claim: Last/family name:" hint="OPTIONAL: The JWT claim containing the last/family name of the user (<code>family_name</code>)" :env-var="envPrefix + 'FIELD_LASTNAME'" />
            <wicked-input v-model="value.config.emailField" label="JWT Claim: Email address:" hint="REQUIRED: The JWT claim containing the email address of the user (<code>email</code>)" :env-var="envPrefix + 'FIELD_EMAIL'" />
            <hr>
            <wicked-input v-model="value.config.params" textarea=true json=true label="Additional request parameters when authorizing (<code>&quot;key&quot;: &quot;value&quot;</code> maps to <code>?key=value</code> in the authorize request):" height="150px" :env-var="envPrefix + 'PARAMS'" />
        </div>
        <div v-else-if="value.type == 'adfs'">
            <wicked-checkbox v-model="value.config.trustUsers" label="Trust user email addresses from this source (maps to <code>email_verified</code>)" />
            <wicked-input v-model="value.config.clientId" label="ADFS client ID:" hint="The ADFS client ID for the wicked API Portal" :env-var="envPrefix + 'CLIENTID'" />
            <wicked-input v-model="value.config.clientSecret" label="ADFS client Secret:" hint="The ADFS client secret for the wicked API Portal (possibly not used)" :env-var="envPrefix + 'CLIENTSECRET'" />
            <wicked-input v-model="value.config.endpoints.authorizeEndpoint" label="Authorize endpoint of the ADFS server:" hint="The authorization endpoint of the upstream ADFS server" :env-var="envPrefix + 'AUTHORIZE_URL'" />
            <wicked-input v-model="value.config.endpoints.tokenEndpoint" label="Token endpoint of the ADFS server:" hint="The token endpoint of the upstream ADFS server" :env-var="envPrefix + 'TOKEN_URL'" />
            <hr>
            <wicked-input v-model="value.config.customIdField" label="JWT claim: Unique ID:" hint="REQUIRED: The JWT claim containing a unique ID from the remote IdP/OAuth2 server; e.g. <code>upn</code> or <code>sub</code>'" :env-var="envPrefix + 'FIELD_CUSTOMID'" />
            <wicked-input v-model="value.config.nameField" label="JWT Claim: Display name (full name):" hint="OPTIONAL: The JWT claim containing the full name/display name of the user (<code>name</code>)" :env-var="envPrefix + 'FIELD_NAME'" />
            <wicked-input v-model="value.config.firstNameField" label="JWT Claim: First/given name:" hint="OPTIONAL: The JWT claim containing the first/given name of the user (<code>given_name</code>)" :env-var="envPrefix + 'FIELD_FIRSTNAME'" />
            <wicked-input v-model="value.config.lastNameField" label="JWT Claim: Last/family name:" hint="OPTIONAL: The JWT claim containing the last/family name of the user (<code>family_name</code>)" :env-var="envPrefix + 'FIELD_LASTNAME'" />
            <wicked-input v-model="value.config.emailField" label="JWT Claim: Email address:" hint="REQUIRED: The JWT claim containing the email address of the user (<code>email</code>)" :env-var="envPrefix + 'FIELD_EMAIL'" />
            <hr>
            <wicked-input v-model="value.config.certificate" textarea=true label="ADFS JWT Signing Certificate:" height="200px" :env-var="envPrefix + 'CERTIFICATE'" />
        </div>
        <div v-else-if="value.type == 'saml'">
            <wicked-checkbox v-model="value.config.trustUsers" label="Trust user email addresses from this source (maps to <code>email_verified</code>)" />
            <wicked-input v-model="value.config.profile" textarea=true json=true label="Profile mapping (from attribute values):" height="200px" :env-var="envPrefix + 'PROFILE_MAP'" />
            <p class="wicked-note">Required claims are <code>sub</code> and <code>email</code>; recommended is also <code>name</code>, supports 
                <a href="https://mustache.github.io" target="_blank">Mustache templates</a>. Attributes are case-insensitive.</p>
            <wicked-input v-model="value.config.spOptions" textarea=true json=true label="SAML Service Profile options:" height="200px" :env-var="envPrefix + 'SP_OPTIONS'" />
            <wicked-input v-model="value.config.idpOptions" textarea=true json=true label="SAML Identity Provider options:" height="200px" :env-var="envPrefix + 'IDP_OPTIONS'" />
            <p>The possible options for "Service Provider" and "Identity Provider" options can be reviewed here: 
                <a href="https://www.npmjs.com/package/saml2-js#ServiceProvider" target="_blank">Service Provider options</a>, 
                <a href="https://www.npmjs.com/package/saml2-js#IdentityProvider" target="_blank">Identity Provider options</a>.</p>
        </div>
        <div v-else>
            <p><i>Unknown auth method type. To change this, please edit the JSON file directly.</i></p>
        </div>
    </wicked-panel>
    `
});

Vue.component('add-auth-method', {
    props: ['value'],
    data: function () {
        return {
            selectedType: null,
            authMethodId: null
        };
    },
    computed: {
        authMethodIdValid: function () {
            return /^[a-z0-9\_-]+$/.test(this.authMethodId);
        }
    },
    methods: {
        addAuthMethod: function () {
            this.value.push({
                enabled: false,
                useForPortal: false,
                type: this.selectedType,
                name: this.authMethodId,
                friendlyShort: 'Short friendly name',
                friendlyLong: 'Long friendly name',
                config: createDefaultConfig(this.selectedType)
            });
        }
    },
    template: `
        <div>
            <div class="form-group">
                <label for="add_auth_method">Add an auth method:</label>
                <select v-model="selectedType" class="form-control">
                    <option disabled value="">Please select a type</option>
                    <option>local</option>
                    <option>google</option>
                    <option>github</option>
                    <option>twitter</option>
                    <option>oauth2</option>
                    <option>adfs</option>
                    <option>saml</option>
                </select>
                <p></p>
                <input v-if="!!selectedType" v-model="authMethodId" class="form-control" placeholder="Enter an auth method id (a-z, 0-9, _, -)">
                <span v-if="!!authMethodId && !authMethodIdValid" style="color:red;">Invalid auth method ID; can only contain lower case characters, digits, - and _</span>
                <p></p>
                <button v-if="authMethodId && authMethodIdValid" v-on:click="addAuthMethod" class="btn btn-primary">Add Auth Method</button>
            </div>
        </div>
    `
});

function createDefaultConfig(authMethodType) {
    switch (authMethodType) {
        case 'local':
            return {
                trustUsers: false,
                disableSignup: false
            };
        case 'github':
        case 'google':
            return {
                clientId: 'your-client-id',
                clientSecret: 'your-client-secret'
            };
        case 'twitter':
            return {
                consumerKey: 'twitter-consumer-key',
                consumerSecret: 'twitter-consumer-secret'
            };
        case 'oauth2':
            return {
                clientId: 'your-client-id',
                clientSecret: 'your-client-secret',
                endpoints: {
                    authorizeEndpoint: 'https://your.idp.com/oauth2/authorize',
                    authorizeScope: 'profile email',
                    tokenEndpoint: 'https://your.idp.com/oauth2/token',
                    profileEndpoint: 'https://your.idp.com/oauth2/profile',
                },
                params: '{}',
                customIdField: 'sub',
                firstNameField: 'given_name',
                lastNameField: 'family_name',
                emailField: 'email'
            };
        case 'adfs':
            return {
                clientId: 'your-client-id',
                clientSecret: 'your-client-secret',
                endpoints: {
                    authorizeEndpoint: 'https://your.idp.com/oauth2/authorize',
                    tokenEndpoint: 'https://your.idp.com/oauth2/token',
                },
                params: {},
                customIdField: 'sub',
                firstNameField: 'given_name',
                lastNameField: 'family_name',
                emailField: 'email',
                certificate: '-----BEGIN CERTIFICATE-----\r\nMIIFBjCCA...'
            };
        case 'saml':
            return {
                trustUsers: true,
                profile: JSON.stringify({
                    "sub": "{{{your_id}}}",
                    "given_name": "{{{firstname}}}",
                    "family_name": "{{{lastname}}}",
                    "name": "{{{firstname}}} {{{lastname}}}",
                    "email": "{{{email}}}"
                }, null, 2),
                "spOptions": JSON.stringify({
                    "nameid_format": "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
                    "certificate": "-----BEGIN CERTIFICATE-----\nMIICuDCC...",
                    "private_key": "-----BEGIN PRIVATE KEY-----\nMIICuDCC...",
                    "sign_get_request": false,
                    "allow_unencrypted_assertion": true
                }, null, 2),
                "idpOptions": JSON.stringify({
                    "sso_login_url": "https://login.saml-provider.com/auth/SSORedirect/metaAlias/idp",
                    "certificates": [
                        "-----BEGIN CERTIFICATE-----\nMIICrTCC..."
                    ],
                    "sign_get_request": false,
                    "allow_unencrypted_assertion": true
                }, null, 2)
            };
        default:
            return {};
    }
}

const vm = new Vue({
    el: '#authserverBase',
    data: injectedData
});

function storeData() {
    const serverId = vm.serverId;
    $.post({
        url: `/authservers/${serverId}/api`,
        data: JSON.stringify(vm.$data),
        contentType: 'application/json'
    }).done(function () {
        alert('Successfully stored data (THIS IS A LIE).');
    });
}
