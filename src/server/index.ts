import app from './app';
import { config } from './config';
import { startPublisher } from './publisher/index';

app.listen(config.port, () => {
  console.log(`FlowPost API rodando em http://localhost:${config.port}`);
  startPublisher();
});
