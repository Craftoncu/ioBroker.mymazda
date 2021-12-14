"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils = __importStar(require("@iobroker/adapter-core"));
const node_mymazda_1 = __importDefault(require("node-mymazda"));
class Mymazda extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: 'mymazda',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }
    async onReady() {
        this.log.debug('Configured Mazda Region ' + this.config.region);
        this.client = new node_mymazda_1.default(this.config.email, this.config.password, this.config.region);
        this.path = 'mymazda.';
        this.setState('info.connection', true, true);
        await this.fetchData();
    }
    onUnload(callback) {
        try {
            callback();
        }
        catch (e) {
            callback();
        }
    }
    onObjectChange(id, obj) {
        if (obj) {
            // The object was changed
            this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
        }
        else {
            // The object was deleted
            this.log.info(`object ${id} deleted`);
        }
    }
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        }
        else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }
    async fetchData() {
        var _a;
        let vehicles;
        // eslint-disable-next-line prefer-const
        vehicles = await ((_a = this.client) === null || _a === void 0 ? void 0 : _a.getVehicles());
        this.log.debug(vehicles);
        for (const vehicle of vehicles) {
            const vehicle_id = vehicle.id;
            //let status = this.client?.getVehicleStatus(vehicle_id)
            await this.createVehicleObjectsIfNotExists(vehicle_id);
        }
    }
    // necessary batterypercentage, locked, drivenDistance
    async createVehicleObjectsIfNotExists(vehicle_id) {
        this.log.info(String(vehicle_id));
        if (this.path) {
            this.createState(this.path, String('vehicle_id'), 'battery', {
                read: true,
                write: true,
                desc: 'Testdesc',
                type: 'boolean',
            });
        }
    }
    async createObjectIfNotExists(identifier, type, datatype, name, desc, role, read, write) {
        await this.setObjectNotExistsAsync(identifier + '.' + name, {
            type: type,
            common: {
                name: desc,
                role: role,
                type: datatype,
                read: read,
                write: write
            },
            native: {}
        });
        if (write) {
            this.subscribeStates(identifier + '.' + name);
        }
    }
}
if (require.main !== module) {
    module.exports = (options) => new Mymazda(options);
}
else {
    (() => new Mymazda())();
}
//# sourceMappingURL=main.js.map