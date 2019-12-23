function Task(processType, params) {
  const content = {};
  if (typeof params === 'string') {
    content.params = params;
    content.mediaType = 'text/plain';
  } else {
    // tag with json
    content.params = JSON.stringify(params);
    content.mediaType = 'application/json';
  }
  this.processType = processType;
  // transfer content buffer
  this.content = Buffer.from(JSON.stringify(content));
}

module.exports = Task;
