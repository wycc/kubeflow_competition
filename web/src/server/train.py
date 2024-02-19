import torch
from torchvision import datasets, transforms

EPOCHS=10

transform=transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])
# load mnist dataset from touchvision
ds = datasets.MNIST('data', download=True,transform=transform)

# get dataloader
dl = torch.utils.data.DataLoader(ds, batch_size=32)

# define a simple model
model = torch.nn.Sequential(
    torch.nn.Linear(784, 128),
    torch.nn.ReLU(),
    torch.nn.Linear(128, 10),
    torch.nn.LogSoftmax(dim=1)
)

model
# define loss function
loss_fn = torch.nn.NLLLoss()

# define optimizer
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

for ep in range(EPOCHS):
  # train the model
  tot_loss=0
  tot_success=0
  count=0
  for images, labels in dl:
      # flatten the images
      images = images.view(images.shape[0], -1)
      # forward pass
      outputs = model(images)
      # calculate loss
      loss = loss_fn(outputs, labels)
      success = (torch.argmax(outputs, dim=1) == labels).sum().item()
      tot_loss+=loss.item()
      tot_success+=success
      # backward pass
      optimizer.zero_grad()
      loss.backward()
      optimizer.step()
      count+=len(images)
  print('epoch', ep, 'loss', tot_loss/count, 'accuracy', tot_success/count*100)


# save the model
torch.save(model, 'model.pth')

