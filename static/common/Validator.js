/* Validator.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 */

const SCHEMA_URL = 'https://raw.githubusercontent.com/ivlab/abr-schema/master/ABRSchema_0-2-0.json';

export class Validator {
    constructor() {
        this._pendingValidations = [];

        this.schemaID = SCHEMA_URL;
        this._schema = null;

        this._validator = fetch(this.schemaID)
            .then((resp) => resp.json())
            .then((j) => {
                this._schema = j
                let ajv = new Ajv();
                ajv.addSchema(this._schema, this.schemaID);
                console.log(`Using ABR Schema, version ${this._schema.properties.version.default}`)
                return ajv;
            });
    }

    async validate(data) {
        return await this._validator.then((v) => {
            if (!v.validate(this.schemaID, data)) {
                throw this.formatErrors(v.errors);
            } else {
                return data;
            }
        });
    }

    get schema() {
        return this._validator.then((_) => this._schema);
    }

    formatErrors(errors) {
        let fmtErrs = [];
        for (const e of errors) {
            let params = [];
            for (let k in e.params) {
                params.push(`${k}: '${e.params[k]}'`);
            }
            params = params.join(', ');
            fmtErrs.push(`${e.dataPath}: ${e.message} (${params})`);
        }
        return fmtErrs.join(', ');
    }
}