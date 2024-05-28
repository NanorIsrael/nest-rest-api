import * as amqp from 'amqplib';

export async function senToQueue(user) {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  await channel.assertQueue('user_queue');
  channel.sendToQueue(
    'user_queue',
    Buffer.from(JSON.stringify({ userId: user._id })),
  );
}
