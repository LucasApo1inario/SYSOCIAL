package logger

import (
	"os"

	"github.com/sirupsen/logrus"
)

// Logger interface para logging
type Logger interface {
	Debug(args ...interface{})
	Info(args ...interface{})
	Warn(args ...interface{})
	Error(args ...interface{})
	Fatal(args ...interface{})
	Debugf(format string, args ...interface{})
	Infof(format string, args ...interface{})
	Warnf(format string, args ...interface{})
	Errorf(format string, args ...interface{})
	Fatalf(format string, args ...interface{})
}

// logger implementa a interface Logger usando logrus
type logger struct {
	*logrus.Logger
}

// New cria uma nova instância do logger
func New() Logger {
	l := logrus.New()

	// Configurar formato baseado na variável de ambiente
	format := os.Getenv("LOG_FORMAT")
	if format == "json" {
		l.SetFormatter(&logrus.JSONFormatter{})
	} else {
		l.SetFormatter(&logrus.TextFormatter{})
	}

	// Configurar nível baseado na variável de ambiente
	level := os.Getenv("LOG_LEVEL")
	switch level {
	case "debug":
		l.SetLevel(logrus.DebugLevel)
	case "info":
		l.SetLevel(logrus.InfoLevel)
	case "warn":
		l.SetLevel(logrus.WarnLevel)
	case "error":
		l.SetLevel(logrus.ErrorLevel)
	default:
		l.SetLevel(logrus.InfoLevel)
	}

	// Configurar output
	l.SetOutput(os.Stdout)

	return &logger{Logger: l}
}

// Implementação dos métodos da interface
func (l *logger) Debug(args ...interface{}) {
	l.Logger.Debug(args...)
}

func (l *logger) Info(args ...interface{}) {
	l.Logger.Info(args...)
}

func (l *logger) Warn(args ...interface{}) {
	l.Logger.Warn(args...)
}

func (l *logger) Error(args ...interface{}) {
	l.Logger.Error(args...)
}

func (l *logger) Fatal(args ...interface{}) {
	l.Logger.Fatal(args...)
}

func (l *logger) Debugf(format string, args ...interface{}) {
	l.Logger.Debugf(format, args...)
}

func (l *logger) Infof(format string, args ...interface{}) {
	l.Logger.Infof(format, args...)
}

func (l *logger) Warnf(format string, args ...interface{}) {
	l.Logger.Warnf(format, args...)
}

func (l *logger) Errorf(format string, args ...interface{}) {
	l.Logger.Errorf(format, args...)
}

func (l *logger) Fatalf(format string, args ...interface{}) {
	l.Logger.Fatalf(format, args...)
}
