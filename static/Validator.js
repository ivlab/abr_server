export class Validator {
    constructor(schemaID) {
        this._pendingValidations = [];

        this.schemaID = schemaID;

        this._validator = fetch(`/api/schemas/${schemaID}`)
            .then((resp) => resp.text())
            .then((text) => {
                let schemaObj = JSON.parse(text);
                let ajv = new Ajv({
                    allErrors: true,
                    verbose: true,
                });
                ajv.addSchema(schemaObj, schemaID);
                return ajv;
            });
    }

    async validate(data) {
        return await this._validator.then((v) => {
            if (!v.validate(this.schemaID, data)) {
                return v.errors;
            } else {
                return null;
            }
        });
    }
}