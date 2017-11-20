/**
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
 */

import React, { Component } from 'react';
import _ from 'lodash';

import sundial from 'sundial';

const DATA_SOURCE_STATE_DISCONNECTED = 'disconnected';
const DATA_SOURCE_STATE_CONNECTED = 'connected';
const DATA_SOURCE_STATE_ERROR = 'error';

const DATA_SOURCE_ERROR_CODE_UNAUTHENTICATED = 'unauthenticated';

export default class DataSources extends Component {
  static propTypes = {
    dataSources: React.PropTypes.array.isRequired,
    fetchDataSources: React.PropTypes.func.isRequired,
    connectDataSource: React.PropTypes.func.isRequired,
    disconnectDataSource: React.PropTypes.func.isRequired,
    authorizedDataSource: React.PropTypes.object,
    trackMetric: React.PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.providers = [
      {
        id: 'oauth/dexcom',
        restrictedTokenCreate: {
            paths: [
              '/v1/oauth/dexcom',
            ],
        },
        dataSourceFilter: {
          providerType: 'oauth',
          providerName: 'dexcom',
        },
        content: {
          description: 'CGM data will be synced from Dexcom',
          connectButton: '',
          disconnectButton: 'Disconnect',
        },
        classNames: {
          logo: 'DataSource-logo-dexcom',
          connectButton: 'btn DataSource-action-button-connect-dexcom',
          disconnectButton: 'btn DataSource-action-button-disconnect-dexcom',
        },
        popup: {
          width: 1080,
          height: 840,
        },
      },
    ];

    this.state = {
      now: sundial.utcDateString(),
      popups: {},
      timeAgoIntervalId: setInterval(this.timeAgoInterval.bind(this), 60000),
    };
  }

  getDataSourceForProvider(provider) {
    return _.first(_.filter(this.props.dataSources, provider.dataSourceFilter))
  }

  calculateState(dataSource) {
    if (dataSource) {
      switch (dataSource.state) {
        case DATA_SOURCE_STATE_DISCONNECTED:
        case DATA_SOURCE_STATE_CONNECTED:
        case DATA_SOURCE_STATE_ERROR:
          return dataSource.state;
        default:
          return DATA_SOURCE_STATE_ERROR;
      }
    }
    return DATA_SOURCE_STATE_DISCONNECTED;
  }

  calculateMessage(dataSource, state) {
    switch (state) {
      case DATA_SOURCE_STATE_DISCONNECTED:
        return 'No data available - click Connect to enable';
      case DATA_SOURCE_STATE_CONNECTED:
        if (!dataSource.lastImportTime) {
          return 'Waiting to import data';
        } else if (!dataSource.latestDataTime) {
          return 'No data found';
        } else {
          return 'Last data ' + this.calculateTimeAgoMessage(dataSource.latestDataTime);
        }
      default:
        return this.calculateErrorMessage(dataSource.error);
    }
  }

  calculateErrorMessage(error) {
    if (error.code && error.code === DATA_SOURCE_ERROR_CODE_UNAUTHENTICATED) {
      return 'Login expired - try signing out & in again';
    }
    return 'An unknown error occurred';
  }

  calculateTimeAgoMessage(timestamp) {
    if (timestamp) {
      for (const units of ['year', 'month', 'week', 'day', 'hour', 'minute']) {
        let diff = sundial.dateDifference(this.state.now, timestamp, units);
        if (diff > 1) {
          return diff + ' ' + units + 's ago';
        } else if (diff > 0) {
          return diff + ' ' + units + ' ago';
        } else if (diff < 0) {
          return 'unknown';
        }
      }
      return 'a few seconds ago';
    }
    return 'unknown';
  }

  calculatePopupId(provider) {
    return 'org.tidepool.web.' + provider.id;
  }

  displayPopupForDataSource(provider) {
    let popupId = this.calculatePopupId(provider)
    let popups = this.state.popups;
    let popup = popups[popupId];

    if (!popup) {
      popup = window.open(null, popupId, 'toolbar=no, location=no, directories=no' +
        ', status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no' +
        ', width=' + provider.popup.width +
        ', height=' + provider.popup.height +
        ', left=' + _.floor(window.screenX + (window.outerWidth / 2) - (provider.popup.width / 2)) +
        ', top=' + _.floor(window.screenY + (window.outerHeight / 2) - (provider.popup.height / 2)));
      popups[popupId] = popup;

      let popupIntervalId = this.state.popupIntervalId;
      if (!popupIntervalId) {
        popupIntervalId = setInterval(this.popupInterval.bind(this), 1000);
      }

      this.setState({ popups, popupIntervalId });
    } else {
      window.open(null, popupId);
    }
  }

  handleConnectDataSource(provider) {
    this.displayPopupForDataSource(provider)
    this.props.connectDataSource(provider.id, provider.restrictedTokenCreate, provider.dataSourceFilter);
    this.props.trackMetric('Web - data source connect clicked', { providerId: provider.id });
  }

  handleDisconnectDataSource(provider) {
    this.props.disconnectDataSource(provider.id, provider.dataSourceFilter);
    this.props.trackMetric('Web - data source disconnect clicked', { providerId: provider.id });

    this.setState({ fetchDataSourcesTimeoutId: setTimeout(this.fetchDataSourcesTimeout.bind(this), 1000) });
  }

  renderButton(provider, state) {
    let text;
    let className;
    let onClick;

    if (state === DATA_SOURCE_STATE_DISCONNECTED) {
      text = provider.content.connectButton;
      className = provider.classNames.connectButton;
      onClick = this.handleConnectDataSource;
    } else {
      text = provider.content.disconnectButton;
      className = provider.classNames.disconnectButton;
      onClick = this.handleDisconnectDataSource;
    }

    return (
      <button className={className} onClick={onClick.bind(this, provider)}>{text}</button>
    )
  }

  renderDataSource(provider) {
    let dataSource = this.getDataSourceForProvider(provider);
    let state = this.calculateState(dataSource);
    let statusIndicatorClassName = 'DataSource-status-indicator-' + state;
    let statusMessage = this.calculateMessage(dataSource, state);

    return (
      <div key={provider.id} className="DataSource">
        <div className="DataSource-info">
          <div>
            <img className={provider.classNames.logo} />
          </div>
          <div className="DataSource-description">{provider.content.description}</div>
          <div className="DataSource-status">
            <div className={statusIndicatorClassName}></div>
            <div className="DataSource-status-message">{statusMessage}</div>
          </div>
        </div>
        <div className="DataSource-action">
          {this.renderButton(provider, state)}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="DataSources">
        {this.providers.map(provider => { return this.renderDataSource(provider); })}
      </div>
    );
  }

  componentDidUpdate() {
    let authorizedDataSource = this.props.authorizedDataSource
    if (authorizedDataSource && authorizedDataSource.url) {
      let popupId = this.calculatePopupId(authorizedDataSource);
      let popup = this.state.popups[popupId];
      if (popup) {
        popup.location.href = authorizedDataSource.url;
      }
      authorizedDataSource.url = null;
    }
  }

  componentWillUnmount() {
    clearInterval(this.state.popupIntervalId);
    clearInterval(this.state.timeAgoIntervalId);
    clearTimeout(this.state.fetchDataSourcesTimeoutId);
  }

  fetchDataSourcesTimeout() {
    this.setState({ fetchDataSourcesTimeoutId: null });
    this.props.fetchDataSources();
  }

  timeAgoInterval() {
    this.setState({ now: sundial.utcDateString() });
  }

  popupInterval() {
    let popups = this.state.popups;
    let changed = false;

    popups = _.omit(popups, function(popup) {
      changed = changed || popup.closed;
      return popup.closed;
    })

    if (changed) {
      let popupIntervalId = this.state.popupIntervalId;

      if (_.isEmpty(popups)) {
        clearInterval(popupIntervalId);
        popupIntervalId = null;
      }

      this.setState({ popups, popupIntervalId });

      this.props.fetchDataSources();
    }
  }
}