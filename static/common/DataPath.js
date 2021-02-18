/* DataPath.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Reimplementation of the DataPath class found in the ABREngine-UnityPackage
 */

const DATA_PATH_TYPES = [
    'ScalarVar',
    'VectorVar',
    'KeyData',
    'Dataset'
];

const separator = '/';

export class DataPath {
    static makePath(orgName, datasetName, dataType, dataName) {
        let fullDataPath = this.join(orgName, datasetName);
        if (dataType) {
            fullDataPath = this.join(fullDataPath, dataType);
        }
        if (dataType && dataName) {
            fullDataPath = this.join(fullDataPath, dataName);
        }
        return fullDataPath;
    }

    static getPathParts(dataPath) {
        return dataPath.split(separator);
    }

    static join(path1, path2) {
        if (path1.endsWith(separator)) {
            return path1 + path2;
        } else {
            return path1 + separator + path2;
        }
    }

    static followsConvention(dataPath, pathType) {
        parts = this.getPathParts(dataPath);
        if (pathType != 'Dataset') {
            return parts.length == 4 && parts[2] == pathType;
        } else {
            return parts.length == 2;
        }
    }

    static getConvention(pathType) {
        if (pathType != 'Dataset') {
            return `Organization/Dataset/${pathType}/Name`;
        } else {
            return 'Organization/Dataset';
        }
    }

    static getOrganization(dataPath) {
        return this.getPathParts(dataPath)[0]
    }
    static getDataset(dataPath) {
        return this.getPathParts(dataPath)[1]
    }
    static getPathType(dataPath) {
        return this.getPathParts(dataPath)[2]
    }
    static getName(dataPath) {
        return this.getPathParts(dataPath)[3]
    }
    static getOrganizationPath(dataPath) {
        return this.getPathParts(dataPath)[0]
    }
    static getDatasetPath(dataPath) {
        return this.join(this.getOrganizationPath(dataPath), this.getPathParts(dataPath)[1])
    }
    static getPathTypePath(dataPath) {
        return this.join(this.getDatasetPath(dataPath), this.getPathParts(dataPath)[2])
    }
    static getNamePath(dataPath) {
        return this.join(this.getPathTypePath(dataPath), this.getPathParts(dataPath)[3])
    }
}