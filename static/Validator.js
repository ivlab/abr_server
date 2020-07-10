export class Validator {
    constructor(schemaID) {
        this._pendingValidations = [];

        this._validator = fetch('/api/schema')
            .then((resp) => resp.text())
            .then((text) => {
                let schemaObj = JSON.parse(text);
                let ajv = new Ajv({
                    allErrors: true,
                    verbose: true,
                });
                ajv.addSchema(schemaObj, schemaID);
                // return ajv.compile(schemaObj);
                return ajv;
            });
    }

    async validate(data) {
        console.log(data);
        let schemaID = data.schemaID;
        let valid = await this._validator.then((v) => {
            console.log(v.validate(schemaID, data));
            console.log(v.errors);
        });
    }
}