const { v4: uuidv4 } = require('uuid');
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const sqsClient = new SQSClient({ });


exports.newOrder = async (event) => {

    const orderid = uuidv4();
    console.log(orderid);
    
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

        const order = {orderid, ...orderDetails}
        console.log(order);

        await sendMessageToSQS(order);

        return {
            statusCode: 200,
            body: JSON.stringify({message: order}),
        };

}

exports.getOrder = async (event) => {

    console.log(event);

    const orderId = event.pathParameters.orderId;
    
    console.log(orderId);

    const orderDetails = {
        "pizza": "Margherita",
        "customerId": "Cust123",
        "Order-Status": "completed"
    }

    const order = {orderId, ...orderDetails}

    console.log(order);

     return {
            statusCode: 200,
            body: JSON.stringify({message: order}),
        };


}

exports.prepOrder = async (event) => {

    console.log(event);
    return;
}


async function sendMessageToSQS(message) {

    const params = {
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: JSON.stringify(message)
    };

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