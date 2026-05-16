/**
 * Apply the `Installer` contract to `FsInstaller`.
 */
import { FsInstaller } from '@adapters/fs/FsInstaller';
import { runInstallerContract } from './Installer.contract';

runInstallerContract('FsInstaller', () => new FsInstaller());
