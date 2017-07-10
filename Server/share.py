import sys
import random

Zp = 127-32

file = sys.argv[1]
parties = int(sys.argv[2])

# Read file
code = ""
with open(file, "r") as myfile:
  code = myfile.read().replace("\n", " ").replace("\t", "  ");

# Compute shares
shares = [ [] for i in range(parties) ]
for i in range(len(code)):
  c = ord(code[i]) - 32
  polynomial = [ (c if j == 0 else random.randint(0, Zp)) for j in range(parties) ]
  
  for j in range(1, parties+1):
    val = polynomial[0]
    power = j
    for k in range(1, len(polynomial)):
      val = val + power * polynomial[k]
      power = power * j
    
    shares[j-1].append(chr((val % Zp) + 32))

base = file[:file.index(".")]
ext = file[file.index("."):]
for j in range(parties):
  with open(base+str(j+1)+ext, 'w') as out:
    for i in range(len(shares[j])):
      out.write(shares[j][i])

# TEST CODE    
test = []    
for i in range(len(code)):
  sh = [ ord(shares[j][i]) - 32 for j in range(parties) ]
  lagrange_coeff = []
  
  for k in range(1, parties+1):
    val = 1
    for j in range(1, parties+1):
      if j != k:
        val = val * (1.0 * (0 - j)) / (k - j)
    lagrange_coeff.append(val)

  secret = 0
  for k in range(parties):
    secret = secret + sh[k] * lagrange_coeff[k]
  test.append(chr((int(round(secret)) % Zp) + 32))
  
print "".join(test) == code
print code
print "".join(test)