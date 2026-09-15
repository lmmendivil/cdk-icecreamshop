const { v4: uuidv4 } = require('uuid');


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



