// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join } from 'path';

export class InstallChaincodeShOptions {
    networkRootPath: string;
    orgs: string[];
    channel: string;
    name: string;
    version: string;
    language: string;
    currentPath: string;
    params: string;
    hyperledgerVersion: string;
    insideDocker: boolean;
}

export class InstallChaincodeShGenerator extends BaseGenerator {
    success = join(this.path, 'tasks/', 'installchaincode.sh.successful');
    contents = `
#!/bin/bash
set -e

${this.options.language==='golang' ? `

if [ -z "$GOROOT" ]; then
    echo "Your $GOROOT variable is not set, make sure it points to the path where you installed Go."

    echo "Defaulting to '/usr/local/go'. This may fail depending where you installed your Go. Please set the var accordingly to your environment"

    export GOROOT=/usr/local/go
fi

export GOPATH=${this.options.networkRootPath}

rm -fr  ${this.options.networkRootPath}/src/go_temp_code
mkdir -p ${this.options.networkRootPath}/src/go_temp_code

cp -r ${this.options.currentPath}/ ${this.options.networkRootPath}/src/go_temp_code

`: ``}

export FABRIC_CFG_PATH=${this.options.networkRootPath}/fabric-binaries/${this.options.hyperledgerVersion}/config

${this.options.orgs.map((org, index) => `
echo "Installing Chaincode at ${org}"

export CORE_PEER_MSPCONFIGPATH=${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${org}.hurley.lab/users/Admin@${org}.hurley.lab/msp
export CORE_PEER_ID=peer0.${org}.hurley.lab
export CORE_PEER_ADDRESS=${this.options.insideDocker ? `peer0.${org}.hurley.lab` : 'localhost'}:${this.options.insideDocker ? '7051' : `7${index}51`}
export CORE_PEER_LOCALMSPID=${org}MSP
export CORE_PEER_TLS_ROOTCERT_FILE=${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${org}.hurley.lab/msp/tlscacerts/tlsca.${org}.hurley.lab-cert.pem

${this.options.language==='golang' ? `
${this.options.networkRootPath}/fabric-binaries/${this.options.hyperledgerVersion}/bin/peer chaincode install\
    -n ${this.options.name}\
    -v ${this.options.version}\
    -p "go_temp_code"\
    -l "${this.options.language}"
`:`
${this.options.networkRootPath}/fabric-binaries/${this.options.hyperledgerVersion}/bin/peer chaincode install\
    -n ${this.options.name}\
    -v ${this.options.version}\
    -p "${this.options.currentPath}"\
    -l "${this.options.language}"
`}

echo "Installed Chaincode at ${org}"
`).join('')}

sleep 10

echo "Instantiating Chaincode at ${this.options.orgs[0]}"
echo "It may take a few minutes depending on the chaincode dependencies"
export CORE_PEER_MSPCONFIGPATH=${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${this.options.orgs[0]}.hurley.lab/users/Admin@${this.options.orgs[0]}.hurley.lab/msp
export CORE_PEER_ID=peer0.${this.options.orgs[0]}.hurley.lab
export CORE_PEER_ADDRESS=${this.options.insideDocker ? `peer0.${this.options.orgs[0]}.hurley.lab` : 'localhost'}:${this.options.insideDocker ? '7051' : `7051`}
export CORE_PEER_LOCALMSPID=${this.options.orgs[0]}MSP
export CORE_PEER_TLS_ROOTCERT_FILE=${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${this.options.orgs[0]}.hurley.lab/msp/tlscacerts/tlsca.${this.options.orgs[0]}.hurley.lab-cert.pem

${this.options.networkRootPath}/fabric-binaries/${this.options.hyperledgerVersion}/bin/peer chaincode instantiate \
    -C ${this.options.channel}\
    -n ${this.options.name}\
    -v ${this.options.version}\
    -c '${this.options.params}'\
    -o ${this.options.insideDocker ? `orderer.hurley.lab` : 'localhost'}:7050\
    --cafile ${this.options.networkRootPath}/artifacts/crypto-config/ordererOrganizations/hurley.lab/orderers/orderer.hurley.lab/msp/tlscacerts/tlsca.hurley.lab-cert.pem

    # -P "${this.getPolicy(this.options.orgs)}"\

echo "Instantiated Chaincode at ${this.options.orgs[0]}"

#mkdir -p ${this.options.networkRootPath}/tasks
#touch ${this.success}
  `;

    constructor(filename: string, path: string, private options: InstallChaincodeShOptions) {
        super(filename, path);
    }

    getPolicy(orgs: string[]): string {
        return `OR(${
            orgs
                .map(org => `'${org}.client'`)
                .join(',')
            })`;
    }

}