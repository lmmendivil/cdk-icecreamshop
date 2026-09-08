#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CdkIcecreamshopStack } from '../lib/cdk-icecreamshop-stack';

const app = new cdk.App();
new CdkIcecreamshopStack(app, 'CdkIcecreamshopStack', {
   
});
