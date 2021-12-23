import * as utils from '@iobroker/adapter-core';
import MyMazda from 'node-mymazda';
import {RegionCode} from 'node-mymazda/dist/MyMazdaAPIConnection';

class Mymazda extends utils.Adapter {

	private client: MyMazda | undefined;

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: 'mymazda',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		this.on('objectChange', this.onObjectChange.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	private async onReady(): Promise<void> {
		this.log.debug('Configured MyMazda account settings ' + this.config.region + ' @ ' + this.config.email)

		this.setState('info.connection', true, true);
		await this.fetchData()
	}

	private async fetchData() {
		this.log.debug('fetchData() called')
		const client = new MyMazda(this.config.email, this.config.password, <RegionCode>this.config.region);
		this.client = client;

		//Loop through the registered vehicles
		await client.getVehicles().then((vehicles) => {
			vehicles.forEach(vehicle => {
				this.setupVehicleStates(vehicle)
				this.updateVehicleStates(vehicle)
			})
		})
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

	private onUnload(callback: () => void): void {
		try {
			callback();
		} catch (e) {
			callback();
		}
	}

	// iobroker role norm: https://github.com/ioBroker/ioBroker/blob/master/doc/STATE_ROLES.md
	private async setupVehicleStates(vehicle: any) { //todo fix with Client.Vehicle
		//todo check if already available and exclude non-electric cars

		//nickname
		await this.createStateAsync(vehicle.vin, 'info', 'nickname', {
			read: true,
			role: 'info.name',
			write: true,
			desc: 'Nickname of vehicle',
			type: 'string',
		});

		//kilometer
		await this.createStateAsync(vehicle.vin, '', 'odometerkm', {
			read: true,
			role: 'value.distance',
			write: true,
			desc: 'Kilometer counter',
			type: 'number',
		});


		//battery
		if (vehicle.isElectric) {
			await this.createStateAsync(vehicle.vin, '', 'battery', {
				read: true,
				role: 'value.battery',
				write: true,
				desc: 'Battery percentage',
				type: 'number',
			});
		}
	}

	private async updateVehicleStates(vehicle: any){
		await this.setStateAsync(vehicle.vin + '.info'+ '.nickname', vehicle.nickname)

		//normal states
		this.client?.getVehicleStatus(vehicle.id).then(vehicleStatus => {
			this.setStateAsync(vehicle.vin + '.odometerkm', vehicleStatus.odometerKm)
		})

		// electro specific stuff
		if (vehicle.isElectric) {
			this.client?.getEVVehicleStatus(vehicle.id).then(evVehicleStatus => {
				this.setStateAsync(vehicle.vin + '.battery', evVehicleStatus.chargeInfo.batteryLevelPercentage)
			})
		}
	}

}

if (require.main !== module) {
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Mymazda(options);
} else {
	(() => new Mymazda())();
}