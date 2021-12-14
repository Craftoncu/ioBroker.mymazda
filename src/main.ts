import * as utils from '@iobroker/adapter-core';
import MyMazda from 'node-mymazda';
import {RegionCode} from 'node-mymazda/dist/MyMazdaAPIConnection';
import MyMazdaAPIClient from 'node-mymazda';

class Mymazda extends utils.Adapter {

	private client? : MyMazdaAPIClient;
	private path? : string;

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
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

	private async onReady(): Promise<void> {
		this.log.debug('Configured Mazda Region ' + this.config.region)
		this.client = new MyMazda(this.config.email, this.config.password, <RegionCode>this.config.region);
		this.path = 'mymazda.'
		this.setState('info.connection', true, true);
		await this.fetchData()
	}

	private onUnload(callback: () => void): void {
		try {
			callback();
		} catch (e) {
			callback();
		}
	}


	private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}


	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	private async fetchData() {
		let vehicles: any;
		// eslint-disable-next-line prefer-const
		vehicles = await this.client?.getVehicles();
		this.log.debug(vehicles)
		for (const vehicle of vehicles) {
			const vehicle_id = vehicle.id;
			//let status = this.client?.getVehicleStatus(vehicle_id)
			await this.createVehicleObjectsIfNotExists(vehicle_id);
		}
	}

	// necessary batterypercentage, locked, drivenDistance
	private async createVehicleObjectsIfNotExists(vehicle_id: number) {
		this.log.info(String(vehicle_id))
		if (this.path) {
			this.createState(this.path, String('vehicle_id'), 'battery', {
				read: true,
				write: true,
				desc: 'Testdesc',
				type: 'boolean',
			});
		}
	}

	private async createObjectIfNotExists(identifier: number, type: any, datatype: any, name: string, desc: string, role: string, read: boolean, write: boolean) {
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
			this.subscribeStates(identifier + '.' + name)
		}
	}

}

if (require.main !== module) {
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Mymazda(options);
} else {
	(() => new Mymazda())();
}