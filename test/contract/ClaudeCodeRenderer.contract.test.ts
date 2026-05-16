/**
 * Apply the `HostRenderer` contract to `ClaudeCodeRenderer`.
 *
 * If a second renderer is added (Codex, Kiro), it gets a parallel file that
 * calls `runHostRendererContract` with its own factory.
 */
import { ClaudeCodeRenderer } from '@adapters/claude-code/ClaudeCodeRenderer';
import { runHostRendererContract } from './HostRenderer.contract';

runHostRendererContract('ClaudeCodeRenderer', () => new ClaudeCodeRenderer());
