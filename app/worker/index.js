/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2017, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

/* global postMessage */

import _ from 'lodash';
import bows from 'bows';

import PDFWorker from './PDFWorker';
import DataWorker from './DataWorker';
import Queue from '../core/Queue';

const dataWorker = new DataWorker();
const pdfWorker = new PDFWorker(dataWorker.dataUtil);
const queue = new Queue();
const log = bows('Worker');

onmessage = (msg) => {
  if (msg) {
    const { patientId } = _.get(msg, 'data.meta', {});

    // Clear queue if queries are for a different patientId
    if (queue.id !== patientId) {
      log('Queue: Set patientId', patientId);
      queue.clear();
      queue.setId(patientId);
    }

    // Add message to queue and process if queue is clear
    queue.add(msg);
    if (!queue.processing) processNextMessage();
  }
};

function processNextMessage() {
  queue.setProcessing(true);
  const msg = queue.getNext();

  switch(_.get(msg, 'data.meta.worker')) {
    case 'pdf':
      pdfWorker.handleMessage(msg, postMessage);
      break;

    case 'data':
      dataWorker.handleMessage(msg, postMessage);
      break;
  }

  queue.setProcessing(false);
  if (queue.items.length) processNextMessage();
}
