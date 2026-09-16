import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Code, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';



export class CdkIcecreamshopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    //SQS
    const pendingOrdersQueue = new Queue(this, 'PendingOrdersQueue', {});
    const ordersToSendQueue = new Queue(this, 'OrdersToSendQueue', {});

    //LAMBDA FUNCTIONS
     const newOrderFunction = new Function(this, 'NewOrderFuncion', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler.newOrder',
      code: Code.fromAsset('lib/functions'),
      environment: {
        QUEUE_URL: pendingOrdersQueue.queueUrl,
      }
        });   
        pendingOrdersQueue.grantSendMessages(newOrderFunction);

      const getOrderFunction = new Function(this, 'GetOrderFuncion', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler.getOrder',
      code: Code.fromAsset('lib/functions'),
        });       


      const prepOrderFunction = new Function(this, 'PrepOrderFuncion', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler.prepOrder',
      code: Code.fromAsset('lib/functions'),
        });  
      
      prepOrderFunction.addEventSource(new SqsEventSource(pendingOrdersQueue, { batchSize: 1  }));

      const sendOrderFunction = new Function(this, 'SendOrderFuncion', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler.sendOrder',
      code: Code.fromAsset('lib/functions'),
      environment: {
         ORDERS_TO_SEND_QUEUE_URL: ordersToSendQueue.queueUrl,
      }
        });

      ordersToSendQueue.grantSendMessages(sendOrderFunction);



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
