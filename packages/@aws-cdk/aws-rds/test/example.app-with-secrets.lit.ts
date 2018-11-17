import ec2 = require('@aws-cdk/aws-ec2');
import kms = require('@aws-cdk/aws-kms');
import cdk = require('@aws-cdk/cdk');
import { DatabaseCluster, DatabaseClusterEngine } from '../lib';
import { ClusterParameterGroup } from '../lib/cluster-parameter-group';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-rds-integ');

const vpc = new ec2.VpcNetwork(stack, 'VPC', { maxAZs: 2 });

const params = new ClusterParameterGroup(stack, 'Params', {
  family: 'aurora5.6',
  description: 'A nice parameter group',
});
params.setParameter('character_set_database', 'utf8mb4');

const kmsKey = new kms.EncryptionKey(stack, 'DbSecurity');

/// !show
const loginSecret = new cdk.SecretsManagerValue(stack, 'Secret', { secretId: 'RDSLogin', });

const cluster = new DatabaseCluster(stack, 'Database', {
  engine: DatabaseClusterEngine.Aurora,
  masterUser: {
    username: loginSecret.jsonKey('username'),
    password: loginSecret.jsonKey('password'),
  },
  instanceProps: {
    instanceType: new ec2.InstanceTypePair(ec2.InstanceClass.Burstable2, ec2.InstanceSize.Small),
    vpcPlacement: { subnetsToUse: ec2.SubnetType.Public },
    vpc
  },
  parameterGroup: params,
  kmsKeyArn: kmsKey.keyArn,
});

/// !hide

cluster.connections.allowDefaultPortFromAnyIpv4('Open to the world');

app.run();
