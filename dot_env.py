import os

try:
	with open('.env', 'r') as file:
		for line in file.read().splitlines():
			[key, value] = [x.strip() for x in line.split("=", 1)]
			if not key in os.environ:
				os.environ[key] = value
except:
	pass
