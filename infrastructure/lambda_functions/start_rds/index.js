const { RDSClient, StartDBInstanceCommand, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');

exports.handler = async (event) => {
  const rds = new RDSClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const dbInstanceId = process.env.DB_INSTANCE_ID;

  try {
    // Check current status first
    const describeResponse = await rds.send(
      new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      })
    );
    
    const status = describeResponse.DBInstances[0].DBInstanceStatus;
    
    if (status === 'available') {
      console.log('RDS is already running');
      return { statusCode: 200, body: 'RDS already running' };
    }
    
    if (status !== 'stopped') {
      console.log(`RDS is in ${status} state, cannot start`);
      return { statusCode: 200, body: `RDS in ${status} state` };
    }

    await rds.send(
      new StartDBInstanceCommand({
        DBInstanceIdentifier: dbInstanceId,
      })
    );
    console.log('RDS started at 11 AM Michigan time');
    return { statusCode: 200, body: 'RDS started' };
  } catch (error) {
    console.error('Error starting RDS:', error);
    throw error;
  }
};
