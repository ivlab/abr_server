/* Validator.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 */

export class Validator {
    constructor(schemaID) {
        this._pendingValidations = [];

        this.schemaID = schemaID;
        this._schema = null;

        this._validator = fetch(`/api/schemas/${schemaID}`)
            .then((resp) => resp.text())
            .then((text) => {
                this._schema = JSON.parse(text);
                let ajv = new Ajv({
                    // allErrors: true,
                    // verbose: true,
                });
                ajv.addSchema(this._schema, schemaID);
                console.log(`Using ABR Schema, version ${this._schema.properties.version.const}`)
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