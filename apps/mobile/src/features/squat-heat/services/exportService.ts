import { SQUAT_HEAT_PROTOCOL, type HeatSessionLog } from '@company/domain';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { buildHeatSessionsCsv } from '../utils/csv';

function toExportBasename() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `squat-heat-${timestamp}`;
}

async function writeTemporaryFile(filename: string, contents: string) {
  const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDir) {
    throw new Error('No writable directory is available.');
  }
  const uri = `${baseDir}${filename}`;
  await FileSystem.writeAsStringAsync(uri, contents, {
    encoding: FileSystem.EncodingType.UTF8
  });
  return uri;
}

async function shareFile(uri: string, mimeType: string, dialogTitle: string) {
  const shareAvailable = await Sharing.isAvailableAsync();
  if (!shareAvailable) {
    Alert.alert('共有できません', 'この端末では共有機能を利用できません。');
    return false;
  }

  await Sharing.shareAsync(uri, { mimeType, dialogTitle });
  return true;
}

export async function exportHeatLogsAsJson(sessions: HeatSessionLog[]) {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    protocol: SQUAT_HEAT_PROTOCOL,
    sessions
  };
  const uri = await writeTemporaryFile(
    `${toExportBasename()}.json`,
    JSON.stringify(payload, null, 2)
  );
  return shareFile(uri, 'application/json', 'スクワットログ(JSON)を共有');
}

export async function exportHeatLogsAsCsv(sessions: HeatSessionLog[]) {
  const csv = buildHeatSessionsCsv(sessions);
  const uri = await writeTemporaryFile(`${toExportBasename()}.csv`, csv);
  return shareFile(uri, 'text/csv', 'スクワットログ(CSV)を共有');
}
