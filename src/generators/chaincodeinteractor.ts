import { resolve } from 'path';
import { InstallChaincodeShGenerator } from './installchaincode.sh';
import { UpgradeChaincodeShGenerator } from './upgradechaincode.sh';
import { l } from '../utils/logs';
import { InvokeChaincodeShGenerator } from './invokechaincode.sh';

export class ChaincodeInteractor {
    invokeScript: InvokeChaincodeShGenerator;

    constructor(public name: string, private fn: string, private options: {
        channel?: string;
        networkRootPath: string;
        params: string[];
        hyperledgerVersion: string;
        insideDocker?: boolean;
        user?: string;
        organization?: string;
    }) {
        this.invokeScript = new InvokeChaincodeShGenerator(options.networkRootPath, {
            channel: this.options.channel || 'ch1',
            name,
            function: fn,
            networkRootPath: options.networkRootPath,
            params: options.params || [],
            hyperledgerVersion: options.hyperledgerVersion,
            insideDocker: this.options.insideDocker,
            user: this.options.user, organization: this.options.organization
        });
    }

    async invoke() {
        return this.invokeScript.run();
    }
}