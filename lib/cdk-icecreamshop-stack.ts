import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Code, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';



export class CdkIcecreamshopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //LAMBDA FUNCTIONS
     const newOrderFunction = new Function(this, 'NewOrderFuncion', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler.newOrder',
      code: Code.fromAsset('lib/functions'),
        });   
        

      const getOrderFunction = new Function(this, 'getOrderFuncion', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler.getOrder',
      code: Code.fromAsset('lib/functions'),
        });       


    //APIs
    const api = new apigateway.RestApi(this, 'IceCreamShopAPI',{
      restApiName: 'Ice Cream Shop Service',
      description: 'This service serves ice cream orders.'
      });

    const orderResource = api.root.addResource('order');
    orderResource.addMethod('POST', new apigateway.LambdaIntegration(newOrderFunction));
    orderResource.addResource('{orderId}').addMethod('GET', new apigateway.LambdaIntegration(getOrderFunction));



         }
}
