import chalk from 'chalk';

export interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

export class Logger {
  private level: number;
  private colors: boolean;

  constructor(level: keyof LogLevel = 'INFO', colors: boolean = true) {
    this.level = this.getLevelValue(level);
    this.colors = colors;
  }

  private getLevelValue(level: keyof LogLevel): number {
    const levels: LogLevel = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
    return levels[level];
  }

  error(message: string, ...args: any[]): void {
    if (this.level >= 0) {
      this.log('ERROR', message, chalk.red, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level >= 1) {
      this.log('WARN', message, chalk.yellow, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level >= 2) {
      this.log('INFO', message, chalk.blue, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.level >= 3) {
      this.log('DEBUG', message, chalk.gray, ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    this.log('SUCCESS', message, chalk.green, ...args);
  }

  private log(level: string, message: string, colorFn: any, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const prefix = this.colors ? colorFn(`[${level}]`) : `[${level}]`;
    const formattedMessage = this.colors ? message : message;

    console.log(`${prefix} ${formattedMessage}`, ...args);
  }

  // Utility methods for common patterns
  logCommand(command: string): void {
    this.debug(`Executing command: ${command}`);
  }

  logConfig(key: string, value: any): void {
    this.debug(`Config ${key}: ${JSON.stringify(value)}`);
  }

  logAgent(name: string, action: string): void {
    this.info(`Agent ${chalk.cyan(name)}: ${action}`);
  }

  logProvider(provider: string, status: string): void {
    const statusColor = status === 'connected' ? chalk.green : chalk.red;
    this.info(`Provider ${chalk.cyan(provider)}: ${statusColor(status)}`);
  }
}

// Default logger instance
export const logger = new Logger();

// Helper functions for quick logging
export const logError = (message: string, ...args: any[]) => logger.error(message, ...args);
export const logWarn = (message: string, ...args: any[]) => logger.warn(message, ...args);
export const logInfo = (message: string, ...args: any[]) => logger.info(message, ...args);
export const logDebug = (message: string, ...args: any[]) => logger.debug(message, ...args);
export const logSuccess = (message: string, ...args: any[]) => logger.success(message, ...args);
