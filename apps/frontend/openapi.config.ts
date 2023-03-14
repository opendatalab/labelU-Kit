const { generateService } = require('@umijs/openapi');

generateService({
  schemaPath: 'http://labelu.shlab.tech/openapi.json',
  serversPath: './openapis',
  namespace: 'Api',
  enumStyle: 'enum',
  requestImportStatement: 'import request from "@/services/request";',
});
