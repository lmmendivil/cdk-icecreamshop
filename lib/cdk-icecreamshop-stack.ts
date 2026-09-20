import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Code, Runtime, Function, StartingPosition, FilterCriteria } from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { DynamoEventSource, SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { AttributeType, BillingMode, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';



export class CdkIcecreamshopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    //SQS
    const pendingOrdersQueue = new Queue(this, 'PendingOrdersQueue', {});
    const ordersToSendQueue = new Queue(this, 'OrdersToSendQueue', {});


    // DynamoDB tables
    const ordersTable = new Table(this, 'OrdersTable', {
      partitionKey: { name: 'orderId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    

    //LAMBDA FUNCTIONS
     const newOrderFunction = new Function(this, 'NewOrderFuncion', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler.newOrder',
      code: Code.fromAsset('lib/functions'),
      environment: {
        QUEUE_URL: pendingOrdersQueue.queueUrl,
        ORDERS_TABLE_NAME: ordersTable.tableName,
      }
        });   
        pendingOrdersQueue.grantSendMessages(newOrderFunction);
        ordersTable.grantWriteData(newOrderFunction);



      const getOrderFunction = new Function(this, 'GetOrderFuncion', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler.getOrder',
      code: Code.fromAsset('lib/functions'),
      environment: {
        ORDERS_TABLE_NAME: ordersTable.tableName,
      }
        });       

      ordersTable.grantReadData(getOrderFunction);



      const prepOrderFunction = new Function(this, 'PrepOrderFuncion', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler.prepOrder',
      code: Code.fromAsset('lib/functions'),

      environment: {
        ORDERS_TABLE_NAME: ordersTable.tableName,
      }
        });
      
      prepOrderFunction.addEventSource(new SqsEventSource(pendingOrdersQueue, { batchSize: 1  }));
      
      ordersTable.grantWriteData(prepOrderFunction);


      
      const sendOrderFunction = new Function(this, 'SendOrderFuncion', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler.sendOrder',
      code: Code.fromAsset('lib/functions'),
      environment: {
         ORDERS_TO_SEND_QUEUE_URL: ordersToSendQueue.queueUrl,
      }
        });

      ordersToSendQueue.grantSendMessages(sendOrderFunction);
      
      sendOrderFunction.addEventSource(new DynamoEventSource(ordersTable, {
      startingPosition: StartingPosition.LATEST,
      batchSize: 1,
      filters: [
        FilterCriteria.filter({
          eventName: ['MODIFY']
        })
      ]
       }));

      ordersTable.grantStreamRead(sendOrderFunction);



    //APIs
      const api = new apigateway.RestApi(this, 'IceCreamShopAPI',{
      restApiName: 'Ice Cream Shop Service',
      description: 'This service serves ice cream orders.'
      });

      const orderResource = api.root.addResource('order');
      orderResource.addMethod('POST', new apigateway.LambdaIntegration(newOrderFunction));
      orderResource.addResource('{orderId}').addMethod('GET', new apigateway.LambdaIntegration(getOrderFunction));


      new cdk.CfnOutput(this, 'PendingOrdersQueueUrl', {
      value: pendingOrdersQueue.queueUrl,
      });

      new cdk.CfnOutput(this, 'OrdersToSendQueueURL', {
      value: ordersToSendQueue.queueUrl,
      });



         }
}
