TESTS = test/cases/*.js
REPORTER = spec
TIMEOUT = 10000
MOCHA_OPTS =

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov:
	@rm -rf coverage.html
	@$(MAKE) test MOCHA_OPTS='--require blanket' REPORTER=html-cov > coverage.html
	@$(MAKE) test MOCHA_OPTS='--require blanket' REPORTER=travis-cov
	@ls -lh coverage.html

test-coveralls:
	@$(MAKE) test
	@echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@-$(MAKE) test MOCHA_OPTS='--require blanket' REPORTER=mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.j

test-all: test test-cov

.PHONY: test
