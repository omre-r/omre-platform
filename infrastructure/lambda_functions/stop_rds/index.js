const { RDSClient, StopDBInstanceCommand, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');

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
    
    if (status === 'stopped') {
      console.log('RDS is already stopped');
      return { statusCode: 200, body: 'RDS already stopped' };
    }
    
    if (status !== 'available') {
      console.log(`RDS is in ${status} state, cannot stop`);
      return { statusCode: 200, body: `RDS in ${status} state` };
    }

    await rds.send(
      new StopDBInstanceCommand({
        DBInstanceIdentifier: dbInstanceId,
      })
    );
    console.log('RDS stopped at 11 PM Michigan time');
    return { statusCode: 200, body: 'RDS stopped' };
  } catch (error) {
    console.error('Error stopping RDS:', error);
    throw error;
  }
};
