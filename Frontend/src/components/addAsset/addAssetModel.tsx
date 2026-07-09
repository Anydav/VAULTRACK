import { Modal } from "../ui/model";
import { useAddAssetModal } from "../../context/addAssetModelcontext";
import SelectAccountStep from "./selectAccountStep";
import CreateAccountStep from "./createAccountStep";
import SelectAssetStep from "./selectAssetStep";
import AssetDetailsStep from "./addDetailStep";

const STEP_TITLES = {
  account: "Select Account",
  createAccount: "Add Account",
  asset: "Select Asset",
  details: "Asset Details",
};

export default function AddAssetModal() {
  const { isOpen, step, closeModal } = useAddAssetModal();

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title={STEP_TITLES[step]}>
      {step === "account" && <SelectAccountStep />}
      {step === "createAccount" && <CreateAccountStep />}
      {step === "asset" && <SelectAssetStep />}
      {step === "details" && <AssetDetailsStep />}
    </Modal>
  );
}