const { v4: uuidv4 } = require('uuid');
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { DynamoDBClient } = require ("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } = require ("@aws-sdk/lib-dynamodb");

const sqsClient = new SQSClient({ });

// Create a DynamoDB client
const client = new DynamoDBClient({}); 
// Create a DynamoDB document client
const docClient = DynamoDBDocumentClient.from(client);


exports.newOrder = async (event) => {

    const orderId = uuidv4();
    console.log(orderId);
    
    let orderDetails;

    try {
        orderDetails = JSON.parse(event.body);
    } catch (error) {
        console.error("Error parsing the order details", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid order details"}),
        };
            }
        console.log(orderDetails)

        const order = {orderId, ...orderDetails}
        console.log(order);

        await saveItemtoDynamoDB(order);

        await sendMessageToSQS(order, process.env.QUEUE_URL);

        return {
            statusCode: 200,
            body: JSON.stringify({message: order}),
        };

}

exports.getOrder = async (event) => {

    console.log(event);

    const orderId = event.pathParameters.orderId;
    
    try {
        const order = await getItemFromDynamoDB(orderId);
        console.log(order)
        return {
            statusCode: 200,
            body: JSON.stringify({message: order}),
        };
    } catch (error) {
        console.error("Error retreiving the order", error);
        
        if(error.name === "ItemNotFoundException") {

            return {
                statusCode: 404,
            body: JSON.stringify({ message: "Order not found"}),
        };
        
    } else {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Error retrieving order"}),
            };
         }
        };
    };

    

    

    console.log(order);

     return {
            statusCode: 200,
            body: JSON.stringify({message: order}),
        };


}

exports.prepOrder = async (event) => {

    console.log(event);

    const body = JSON.parse(event.Records[0].body);
    const orderId = body.orderId;

    await updateStatusInOrder(orderId, COMPLETED);



    return;
}

exports.sendOrder = async (event) => {

    console.log(event);
    
    const order = {
        orderId: event.orderId,
        pizza: event.pizza,
        customerId: event.customerId
    }

    const ORDERS_TO_SEND_QUEUE_URL = process.env.ORDERS_TO_SEND_QUEUE_URL

    const sqsResponse = await sendMessageToSQS(order, ORDERS_TO_SEND_QUEUE_URL);

    return {
        statusCode: 200,
        body: JSON.stringify({ message: order, messageId: sqsResponse.MessageId }),
    }


}


async function sendMessageToSQS(message, queueURL) {

    const params = {
        QueueUrl: queueURL,
        MessageBody: JSON.stringify(message)
    };

    console.log(params);

    try {
        const command = new SendMessageCommand(params);
        const response = await sqsClient.send(command);
        console.log("Message sent to SQS:", response.MessageId);
        return response;
    } catch (error) {
        console.error("Error sending message to SQS:", error);
        throw error;
    }
} 

async function saveItemtoDynamoDB(item) {
    const params = {
        TableName: process.env.ORDERS_TABLE_NAME,
        Item: item
    };

    try {
        const command = new PutCommand(params);
        const response = await docClient.send(command);
        console.log("Item saved to DynamoDB:", response);
        return response;
    } catch (error) {
        console.error("Error saving item to DynamoDB:", error);
        throw error;
    }

}

async function updateStatusInOrder(orderId, newstatus) {

        const params = {
        TableName: process.env.ORDERS_TABLE_NAME,
        Key: {
            orderId: orderId
        },
        UpdateExpression: "set order_status = :c",
        ExpressionAttributeValues: {
            ":c": newstatus
        }
    };

    try {
        const command = new UpdateCommand(params);
        const response = await docClient.send(command);
        console.log("Order status updated:", response);
        return response;
    } catch (error) {
        console.error("Error updating order status:", error);
        throw error;
    }

}

async function getItemFromDynamoDB(orderId) {
   
    const params = {
        TableName: process.env.ORDERS_TABLE_NAME,
        Key: {
            orderId: orderId
        }
    };

    try {
        const command = new GetCommand(params);
        const response = await docClient.send(command);

        if(response.Item) {
            console.log("Item retrieved from DynamoDB:", response.Item);
            return response.Item;
        } else {
            console.log("Item not found");

            let notFoundError = new Error("Item not found");
            notFoundError.name = "ItemNotFoundException";
            throw notFoundError;
        }

    } catch (error) {
        console.log("Error retrieving the order", error);
        throw error;

        
    }

} 