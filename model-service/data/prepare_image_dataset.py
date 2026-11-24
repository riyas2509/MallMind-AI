"""
Prepares the image dataset for Deep Learning Model 2: product image
classification (Part 4, Module 5).

DATASET LICENSING (Part 12 / Part 17 rule #7 -- "verified licensing"):
MallMind has no licensed photography of its own synthetic catalogue, so
training a product-image classifier on "real" MallMind product photos is
not possible honestly. Instead we use **Fashion-MNIST** (Xiao, Rasul &
Vollgraf, Zalando Research, 2017), a well-known, openly and permissively
licensed (MIT License) academic benchmark of 70,000 grayscale clothing/
accessory images across 10 classes:
    https://github.com/zalandoresearch/fashion-mnist (LICENSE file: MIT)
Downloaded here via torchvision.datasets.FashionMNIST, which fetches it
directly from the dataset's own hosted mirror.

CLASS MAPPING -- the 10 fine-grained Fashion-MNIST classes are grouped
into 3 of MallMind's REAL platform categories (not the spec's example
5-class list, which doesn't exist as a licensed dataset we could find):

    Footwear            <- Sandal, Sneaker, Ankle boot
    Apparel             <- T-shirt/top, Trouser, Pullover, Dress, Coat, Shirt
    Bags & Accessories  <- Bag

HONEST LIMITATION: Electronics, Jewelry, and the platform's other 13
categories have NO corresponding images in this dataset -- there is no
licensed public dataset of those specific categories readily available
offline. This classifier only recognizes these 3 categories, and the
model service must report low-confidence/unknown rather than guess
outside them (see app/image_classifier.py's fallback behaviour).

Run (downloads ~30MB on first run):
    .venv/Scripts/python.exe data/prepare_image_dataset.py
"""
import os

import numpy as np
from torchvision import datasets

SEED = 42
rng = np.random.RandomState(SEED)

RAW_TO_SUPER = {
    5: "Footwear", 7: "Footwear", 9: "Footwear",
    0: "Apparel", 1: "Apparel", 2: "Apparel", 3: "Apparel", 4: "Apparel", 6: "Apparel",
    8: "Bags & Accessories",
}
SUPER_CLASSES = ["Apparel", "Bags & Accessories", "Footwear"]  # alphabetical, fixed order

# Per-RAW-class sample counts chosen so each SUPER-class ends up balanced:
#   Apparel:            6 raw classes x N_APPAREL  = total
#   Footwear:           3 raw classes x N_FOOTWEAR  = total
#   Bags & Accessories: 1 raw class  x N_BAG        = total
N_APPAREL_TRAIN, N_FOOTWEAR_TRAIN, N_BAG_TRAIN = 250, 500, 1500   # -> 1500 each
N_APPAREL_VAL, N_FOOTWEAR_VAL, N_BAG_VAL = 40, 80, 240            # -> 240 each
N_APPAREL_TEST, N_FOOTWEAR_TEST, N_BAG_TEST = 40, 80, 240         # -> 240 each

def sample_from_train(dataset, counts: dict):
    images, labels = [], []
    targets = np.array(dataset.targets)
    for raw_label, n in counts.items():
        idx = np.where(targets == raw_label)[0]
        chosen = rng.choice(idx, size=min(n, len(idx)), replace=False)
        for i in chosen:
            img, _ = dataset[i]
            images.append(np.array(img))
            labels.append(SUPER_CLASSES.index(RAW_TO_SUPER[raw_label]))
    return np.stack(images), np.array(labels)


def main():
    data_dir = os.path.join(os.path.dirname(__file__), "fashion_mnist_raw")

    train_full = datasets.FashionMNIST(root=data_dir, train=True, download=True, transform=None)
    test_full = datasets.FashionMNIST(root=data_dir, train=False, download=True, transform=None)

    train_counts = {0: N_APPAREL_TRAIN, 1: N_APPAREL_TRAIN, 2: N_APPAREL_TRAIN, 3: N_APPAREL_TRAIN,
                    4: N_APPAREL_TRAIN, 6: N_APPAREL_TRAIN, 5: N_FOOTWEAR_TRAIN, 7: N_FOOTWEAR_TRAIN,
                    9: N_FOOTWEAR_TRAIN, 8: N_BAG_TRAIN}
    val_counts = {0: N_APPAREL_VAL, 1: N_APPAREL_VAL, 2: N_APPAREL_VAL, 3: N_APPAREL_VAL,
                  4: N_APPAREL_VAL, 6: N_APPAREL_VAL, 5: N_FOOTWEAR_VAL, 7: N_FOOTWEAR_VAL,
                  9: N_FOOTWEAR_VAL, 8: N_BAG_VAL}
    test_counts = {0: N_APPAREL_TEST, 1: N_APPAREL_TEST, 2: N_APPAREL_TEST, 3: N_APPAREL_TEST,
                   4: N_APPAREL_TEST, 6: N_APPAREL_TEST, 5: N_FOOTWEAR_TEST, 7: N_FOOTWEAR_TEST,
                   9: N_FOOTWEAR_TEST, 8: N_BAG_TEST}

    train_images, train_labels = sample_from_train(train_full, train_counts)

    # Val and test both come from FashionMNIST's own held-out test split
    # (never seen during training), split further into val/test halves
    # per raw class so neither overlaps the other.
    targets_test = np.array(test_full.targets)
    val_images, val_labels, test_images, test_labels = [], [], [], []
    for raw_label in val_counts:
        idx = np.where(targets_test == raw_label)[0]
        rng.shuffle(idx)
        n_val, n_test = val_counts[raw_label], test_counts[raw_label]
        val_idx, test_idx = idx[:n_val], idx[n_val:n_val + n_test]
        for i in val_idx:
            img, _ = test_full[i]
            val_images.append(np.array(img))
            val_labels.append(SUPER_CLASSES.index(RAW_TO_SUPER[raw_label]))
        for i in test_idx:
            img, _ = test_full[i]
            test_images.append(np.array(img))
            test_labels.append(SUPER_CLASSES.index(RAW_TO_SUPER[raw_label]))

    out_path = os.path.join(os.path.dirname(__file__), "product_images.npz")
    np.savez_compressed(
        out_path,
        train_images=train_images, train_labels=train_labels,
        val_images=np.stack(val_images), val_labels=np.array(val_labels),
        test_images=np.stack(test_images), test_labels=np.array(test_labels),
        class_names=np.array(SUPER_CLASSES),
    )

    print(f"train: {train_images.shape}, val: {len(val_images)}, test: {len(test_images)}")
    print("class order:", SUPER_CLASSES)
    print(f"Saved -> {out_path}")


if __name__ == "__main__":
    main()
