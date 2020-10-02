import React from 'react';
import PropTypes from 'prop-types';
import { cloneDeep, pull, map, union, get, includes } from 'lodash';
import Accordion from '../elements/Accordion';
import Checkbox from '../elements/Checkbox';
import { Box, Flex } from 'rebass/styled-components';

import { colors, fontSizes } from '../../themes/baseTheme';

export const DeviceSelection = (props) => {
  const { chartPrefs,  devices = [], updateChartPrefs, removeGeneratedPDFS } = props;
  const excludedDevices = get(chartPrefs, 'excludedDevices', []);

  const toggleDevice = (e) => {
    const prefs = cloneDeep(chartPrefs);

    if (e.target.checked) {
      pull(prefs.excludedDevices, e.target.value);
    } else {
      prefs.excludedDevices = union(prefs.excludedDevices, [e.target.value]);
    }

    updateChartPrefs(prefs, true, true);
    removeGeneratedPDFS();
  };

  return (
    <Accordion
      label={'deviceSelection'}
      header={
        <Flex flexDirection="row" justifyContent="space-between" flexGrow="1">
          <Box>Filter Devices</Box>
          <Box fontSize={3}>{devices.length - excludedDevices.length}</Box>
        </Flex>
      }
      children={map(devices, ({id, label}) => (
        <Checkbox
          checked={!includes(excludedDevices, id)}
          onChange={toggleDevice}
          label={label || id}
          name={`${id}-toggle`}
          value={id}
          key={id}
          themeProps={{ color: colors.stat.text }}
        />
      ))}
      square={false}
      themeProps={{
        wrapper: {
          sx: {
            '.MuiExpansionPanelSummary-root': {
              minHeight: '34px',
              '&.Mui-expanded': {
                minHeight: '34px',
              },
            },
          },
          style: {
            border: `1px solid ${colors.stat.border}`,
            borderRadius: '8px',
            fontSize: `${fontSizes[2]}px`,
          },
        },
        header: {
          style: {
            borderRadius: '8px',
            padding: '0px 12px',
          },
          sx: {
            margin: '0.25em 0.625em',
            height: '1.5em',
            padding: '0px',
            '.MuiExpansionPanelSummary-content': {
              color: colors.stat.text,
              margin: '0px',
              '&.Mui-expanded': {
                margin: '0px',
              },
            },
            '.MuiExpansionPanelSummary-expandIcon': {
              // This CSS specificity fight wasn't my favorite but is required to override `styled-component` styles down the line
              '&.MuiExpansionPanelSummary-expandIcon': {
                '&.MuiIconButton-edgeEnd': {
                  padding: '0px',
                  margin: '0px 12px 0px 0px',
                },
              },
            },
          },
        },
        panel: {
          style: {
            flexDirection: 'column',
          },
        },
      }}
    />
  );
};

DeviceSelection.propTypes = {
  chartPrefs: PropTypes.shape({
    excludedDevices: PropTypes.array,
  }),
  devices: PropTypes.arrayOf(
    PropTypes.shape({
      bgm: PropTypes.bool,
      cgm: PropTypes.bool,
      id: PropTypes.string,
      label: PropTypes.string,
      pump: PropTypes.bool,
      serialNumber: PropTypes.string,
    }
  )),
  removeGeneratedPDFS: PropTypes.func.isRequired,
  updateChartPrefs: PropTypes.func.isRequired,
};

export default DeviceSelection;
